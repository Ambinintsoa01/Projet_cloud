import axios from 'axios'
import { storageService } from './storage.service'

// Détermine l'URL de l'API
const getApiUrl = () => {
  // Vérifier la variable d'environnement d'abord
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // En production, utiliser une URL relative
  if (!import.meta.env.DEV) {
    return '/api'
  }
  
  // En développement, utiliser le localhost
  return 'http://localhost:8080'
}

const API_BASE_URL = getApiUrl()

console.log('🔗 API URL:', API_BASE_URL)

// Client axios partagé
const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Intercepteur requêtes : ajoute le token JWT si présent
http.interceptors.request.use((config) => {
  const token = storageService.getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur réponses : nettoie le stockage sur 401
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const resp = error?.response
    if (resp && resp.status === 401) {
      storageService.removeAuthToken()
      storageService.removeUserData()
    }
    return Promise.reject(resp || error)
  }
)

const normalizeAuthResponse = (data) => ({
  token: data?.token,
  expiresAt: data?.expiresAt,
  user: {
    id: data?.userId ?? null,
    email: data?.email ?? '',
    username: data?.username ?? '',
    roles: Array.isArray(data?.roles)
      ? data.roles
      : data?.roles
        ? [data.roles]
        : []
  }
})

export const ApiService = {
  async login(email, password) {
    const res = await http.post('/api/auth/login', { email, password })
    return normalizeAuthResponse(res.data)
  },

  async register({ fullName, email, password }) {
    const res = await http.post('/api/auth/register', {
      username: fullName,
      email,
      password,
      role: 'USER'
    })
    return normalizeAuthResponse(res.data)
  },

  async getUsers() {
    const res = await http.get('/api/auth/users')
    return res.data
  },

  async updateUser(id, payload) {
    const res = await http.put(`/api/auth/user/${id}`, payload)
    return res.data
  },

  async unblockUser(id) {
    const res = await http.post(`/api/auth/user/${id}/unblock`)
    return res.data
  },

  async forceSync() {
    const res = await http.post('/api/auth/sync')
    return res.data
  },

  async connectionStatus() {
    const res = await http.get('/api/status/connection')
    return res.data
  },

  // Problemes endpoints
  async createProbleme(data) {
    const res = await http.post('/api/problemes', {
      latitude: data.latitude,
      longitude: data.longitude,
      typeId: data.typeId || null,
      description: data.description
    })
    return res.data
  },

  async listProblemes() {
    const res = await http.get('/api/problemes')
    return res.data
  },

  async listOpenProblemes() {
    const res = await http.get('/api/problemes/ouverts')
    return res.data
  },

  async listMyProblemes() {
    const res = await http.get('/api/problemes/user/me')
    return res.data
  },

  async convertProbleme(problemeId, conversionData) {
    const res = await http.post(`/api/problemes/${problemeId}/convert`, {
      typeId: conversionData.typeId,
      description: conversionData.description,
      surfaceM2: conversionData.surfaceM2 || null,
      budget: conversionData.budget || null
    })
    return res.data
  },

  // Signalements endpoints (existing Firestore method)
  async createSignalement(data) {
    // This is a placeholder - actual implementation uses Firebase/Firestore
    const res = await http.post('/api/signalements', {
      latitude: data.latitude,
      longitude: data.longitude,
      typeId: data.typeId,
      description: data.description,
      surfaceM2: data.surfaceM2 || null,
      budget: data.budget || null,
      entrepriseConcernee: data.entrepriseConcernee || null,
      isAnonymous: data.isAnonymous || false,
      photos: data.photos || []
    })
    return res.data
  },

  // Récupérer tous les signalements (Firebase en ligne, Postgres hors ligne)
  async getAllSignalements(options = {}) {
    const { preferFirebase = true, syncOnOnline = false } = options
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

    const normalizeArray = (data) => (Array.isArray(data) ? data : [])

    const mergeSignalements = (firebaseData, localData) => {
      const merged = new Map()

      normalizeArray(localData).forEach(item => {
        const key = item.firebaseId || item.id
        if (key != null) merged.set(String(key), item)
      })

      normalizeArray(firebaseData).forEach(item => {
        const key = item.firebaseId || item.id
        if (key != null && !merged.has(String(key))) {
          merged.set(String(key), item)
        }
      })

      return Array.from(merged.values())
    }

    const getLocal = async () => {
      const res = await http.get('/api/signalements')
      return res.data
    }

    // Pour les visiteurs sans token, utiliser juste l'API publique
    const hasToken = !!storageService.getAuthToken()
    if (!hasToken) {
      try {
        return await getLocal()
      } catch (error) {
        console.error('❌ Erreur lors du chargement des signalements:', error)
        return storageService.getReportsData() || []
      }
    }

    // Pour les utilisateurs authentifiés, essayer Firebase d'abord
    if (preferFirebase && isOnline) {
      if (syncOnOnline) {
        try {
          await this.forceSync()
        } catch (e) {
          // Ne pas bloquer si la sync échoue
        }
      }

      try {
        const getFirebase = async () => {
          const res = await http.get('/api/firebase/signalements')
          return res.data
        }

        const firebaseData = normalizeArray(await getFirebase())

        // Si Firebase retourne peu de données, tenter le local et prendre le plus complet
        try {
          const localData = normalizeArray(await getLocal())
          if (localData.length > firebaseData.length) {
            return localData
          }
          if (localData.length > 0 && firebaseData.length > 0) {
            return mergeSignalements(firebaseData, localData)
          }
        } catch (e) {
          // Ignorer si le local échoue
        }

        return firebaseData
      } catch (error) {
        try {
          return await getLocal()
        } catch (fallbackError) {
          // fallback storage si tout échoue
          return storageService.getReportsData()
        }
      }
    }

    try {
      return await getLocal()
    } catch (error) {
      return storageService.getReportsData()
    }
  },

  logout() {
    storageService.removeAuthToken()
    storageService.removeUserData()
  }
}

// Instance exportée pour utilisation globale
export const apiService = ApiService
