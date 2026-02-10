import axios from 'axios';

// Configuration du client axios avec l'URL de base du backend
const API_BASE_URL = 'http://localhost:8080'; // À adapter selon votre configuration

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache helpers for offline mode
const CACHE_KEYS = {
  signalements: 'cache_signalements',
  signalementTypes: 'cache_signalement_types',
  problemes: 'cache_problemes',
  problemesOuverts: 'cache_problemes_ouverts',
  problemesMine: 'cache_problemes_mine',
  users: 'cache_users',
  blockedUsers: 'cache_blocked_users'
};

const readCache = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      console.log(`📦 Cache ${key}: empty, returning fallback`);
      return fallback;
    }
    const data = JSON.parse(raw);
    console.log(`📦 Cache ${key}: loaded ${Array.isArray(data) ? data.length : 'object'} items`);
    return data;
  } catch (e) {
    console.error(`❌ Cache ${key}: parse error`, e);
    return fallback;
  }
};

const writeCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`✅ Cache ${key}: saved ${Array.isArray(data) ? data.length : 'object'} items`);
  } catch (e) {
    // ignore cache write errors
    console.error(`❌ Cache ${key}: write error`, e);
  }
};

const shouldUseCache = (error) => {
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const status = error?.status || error?.response?.status;
  const useCache = isOffline || status === 401;
  if (useCache) {
    console.log(`🔄 Using cache fallback: offline=${isOffline}, status=${status}`);
  }
  return useCache;
};

// Ajouter le token JWT à chaque requête si disponible
apiClient.interceptors.request.use((config) => {
  const url = config.url || '';
  // Skip attaching token for login/register endpoints
  if (url.includes('/api/auth/login') || url.includes('/api/auth/register')) {
    return config;
  }
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`📝 Request: adding Bearer token for ${url}`);
  } else {
    console.log(`📝 Request: no token for ${url} (will try without auth)`);
  }
  return config;
});

// Global response interceptor to handle auth errors centrally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const resp = error.response;

    // Si 401, gérer la session selon le contexte
    if (resp && resp.status === 401) {
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

      // Si online et 401 sur endpoint protégé => session invalide, forcer reconnexion
      if (!isOffline && !isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }

      return Promise.reject(resp);
    }

    // Pour 403 (forbidden) ou autres erreurs, laisser l'appelant gérer
    return Promise.reject(resp || error);
  }
);

// Service d'authentification
export const authService = {
  // Fonction de login
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Normaliser les rôles pour garantir un tableau
        let roles = response.data.roles;
        if (!Array.isArray(roles)) {
          if (typeof roles === 'string') {
            roles = roles.split(',').map((r) => r.trim()).filter(Boolean);
          } else if (roles) {
            roles = [roles];
          } else {
            roles = [];
          }
        }
        // Stocker les données complètes de l'utilisateur incluant les rôles normalisés
        const userData = {
          userId: response.data.userId,
          email: response.data.email,
          username: response.data.username,
          roles,
          expiresAt: response.data.expiresAt,
        };
        localStorage.setItem('user', JSON.stringify(userData));
      }
      return response.data;
    } catch (error) {
      throw error.response || error;
    }
  },

  // Fonction de register (inscription)
  register: async (name, email, password) => {
    try {
      const response = await apiClient.post('/api/auth/register', {
        username: name,
        email,
        password,
        role: 'USER'
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response || error;
    }
  },

  // Fonction pour enregistrer un client (par un admin, sans se connecter)
  registerCustomer: async (name, email, password) => {
    try {
      const response = await apiClient.post('/api/auth/register', {
        username: name,
        email,
        password,
        role: 'USER',
      });
      // Ne pas sauvegarder le token car c'est l'admin qui enregistre un client
      return response.data;
    } catch (error) {
      throw error.response || error;
    }
  },

  // Fonction pour mettre à jour un utilisateur
  updateUser: async (id, userData) => {
    try {
      const response = await apiClient.put(`/api/auth/user/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response || error;
    }
  },

  // Fonction pour forcer la synchronisation
  forceSync: async (timeoutMs = 60000) => {
    try {
      const response = await apiClient.post('/api/auth/sync', null, {
        timeout: timeoutMs,
      });
      return response.data;
    } catch (error) {
      throw error.response || error;
    }
  },

  // Fonction pour débloquer un utilisateur
  unblockUser: async (id) => {
    try {
      const response = await apiClient.post(`/api/auth/user/${id}/unblock`);
      return response.data;
    } catch (error) {
      throw error.response || error;
    }
  },

  // Fonction pour récupérer les utilisateurs bloqués
  getBlockedUsers: async () => {
    try {
      const response = await apiClient.get('/api/auth/users/blocked');
      writeCache(CACHE_KEYS.blockedUsers, response.data);
      return response.data;
    } catch (error) {
      if (shouldUseCache(error)) {
        return readCache(CACHE_KEYS.blockedUsers, []);
      }
      throw error.response || error;
    }
  },

  // Fonction pour récupérer la liste des utilisateurs
  getUsers: async () => {
    try {
      const response = await apiClient.get('/api/auth/users');
      writeCache(CACHE_KEYS.users, response.data);
      return response.data;
    } catch (error) {
      if (shouldUseCache(error)) {
        return readCache(CACHE_KEYS.users, []);
      }
      throw error.response || error;
    }
  },

  // Fonction logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Obtenir l'utilisateur courant
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

// Service pour les problèmes (Problemes)
export const problemService = {
  // Créer un problème
  createProblem: async (data) => {
    try {
      const response = await apiClient.post('/api/problemes', {
        latitude: data.latitude,
        longitude: data.longitude,
        typeId: data.typeId || null,
        description: data.description
      });
      return response.data;
    } catch (error) {
      throw error.response || error;
    }
  },

  // Récupérer tous les problèmes
  listProblems: async () => {
    try {
      const response = await apiClient.get('/api/problemes');
      writeCache(CACHE_KEYS.problemes, response.data);
      return response.data;
    } catch (error) {
      if (shouldUseCache(error)) {
        return readCache(CACHE_KEYS.problemes, []);
      }
      throw error.response || error;
    }
  },

  // Récupérer les problèmes ouverts (pour les managers)
  listOpenProblems: async () => {
    try {
      const response = await apiClient.get('/api/problemes/ouverts');
      writeCache(CACHE_KEYS.problemesOuverts, response.data);
      return response.data;
    } catch (error) {
      if (shouldUseCache(error)) {
        return readCache(CACHE_KEYS.problemesOuverts, []);
      }
      throw error.response || error;
    }
  },

  // Récupérer mes problèmes
  listMyProblems: async () => {
    try {
      const response = await apiClient.get('/api/problemes/user/me');
      writeCache(CACHE_KEYS.problemesMine, response.data);
      return response.data;
    } catch (error) {
      if (shouldUseCache(error)) {
        return readCache(CACHE_KEYS.problemesMine, []);
      }
      throw error.response || error;
    }
  },

  // Convertir un problème en signalement
  convertProblem: async (problemId, conversionData) => {
    try {
      const response = await apiClient.post(`/api/problemes/${problemId}/convert`, {
        typeId: conversionData.typeId,
        description: conversionData.description,
        surfaceM2: conversionData.surfaceM2 || null,
        budget: conversionData.budget || null,
        niveau: conversionData.niveau || null
      });
      return response.data;
    } catch (error) {
      throw error.response || error;
    }
  }
};

const getAllSignalementsLocal = async () => {
  const response = await apiClient.get('/api/signalements');
  return response.data;
};

// Service pour les signalements
export const signalementService = {
  // Créer un signalement
  createSignalement: async (data) => {
    try {
      const response = await apiClient.post('/api/signalements', {
        latitude: data.latitude,
        longitude: data.longitude,
        typeId: data.typeId,
        description: data.description,
        surfaceM2: data.surfaceM2 || null,
        budget: data.budget || null,
        entrepriseConcernee: data.entrepriseConcernee || null,
        isAnonymous: data.isAnonymous || false,
        photos: data.photos || []
      });
      return response.data;
    } catch (error) {
      throw error.response || error;
    }
  },

  // Récupérer tous les signalements (PostgreSQL uniquement, cache local en mode offline)
  getAllSignalements: async () => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (!isOnline) {
      return readCache(CACHE_KEYS.signalements, []);
    }

    try {
      const data = await getAllSignalementsLocal();
      writeCache(CACHE_KEYS.signalements, data);
      return data;
    } catch (error) {
      if (shouldUseCache(error)) {
        return readCache(CACHE_KEYS.signalements, []);
      }
      throw error.response || error;
    }
  },

  // Récupérer les types de signalements
  getSignalementTypes: async () => {
    try {
      const response = await apiClient.get('/api/signalement-types');
      writeCache(CACHE_KEYS.signalementTypes, response.data);
      return response.data;
    } catch (error) {
      if (shouldUseCache(error)) {
        return readCache(CACHE_KEYS.signalementTypes, []);
      }
      throw error.response || error;
    }
  },

  // Mettre à jour un signalement
  updateSignalement: async (id, data) => {
    try {
      console.log('📝 Mise à jour du signalement #' + id, data);
      const payload = {
        description: data.description || null,
        status: data.status || null,
        surfaceM2: data.surfaceM2 || null,
        budget: data.budget || null,
        entrepriseConcernee: data.entrepriseConcernee || null
      };
      console.log('📤 Payload envoyé:', JSON.stringify(payload));
      
      const response = await apiClient.put(`/api/signalements/${id}`, payload);
      
      console.log('✅ Réponse du serveur:', response.data);
      // Invalider le cache après mise à jour
      localStorage.removeItem(CACHE_KEYS.signalements);
      console.log('🗑️  Cache invalidé');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      throw error.response || error;
    }
  },

  // Changer le statut d'un signalement
  updateSignalementStatus: async (id, status) => {
    try {
      const response = await apiClient.put(`/api/signalements/${id}`, {
        status: status
      });
      // Invalider le cache après mise à jour
      localStorage.removeItem(CACHE_KEYS.signalements);
      return response.data;
    } catch (error) {
      throw error.response || error;
    }
  }
};

export default apiClient;
