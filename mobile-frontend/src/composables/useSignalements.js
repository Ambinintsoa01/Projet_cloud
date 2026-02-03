import { ref } from 'vue'
import {
  collection,
  addDoc,
  getDocs,
  setDoc,
  doc,
  query,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db, auth } from '@/services/firebase.service'
import { signInAnonymously } from 'firebase/auth'

const SIGNALEMENT_TYPES = [
  {
    id: '1',
    libelle: 'Problème critique',
    icon_color: 'red',
    icon_symbol: '!'
  },
  {
    id: '2',
    libelle: 'Travaux en cours',
    icon_color: 'purple',
    icon_symbol: 'car'
  },
  {
    id: '3',
    libelle: 'Problème résolu',
    icon_color: 'green',
    icon_symbol: 'check'
  },
  {
    id: '4',
    libelle: 'Alerte signalée',
    icon_color: 'yellow',
    icon_symbol: '!'
  },
  {
    id: '5',
    libelle: 'Infrastructure endommagée',
    icon_color: 'orange',
    icon_symbol: 'wrench'
  },
  {
    id: '6',
    libelle: "Problème d'inondation",
    icon_color: 'blue',
    icon_symbol: 'water'
  },
  {
    id: '7',
    libelle: 'Chaussée dégradée',
    icon_color: 'red-white',
    icon_symbol: 'checkered'
  }
]

export function useSignalements() {
  const isLoading = ref(false)
  const error = ref(null)
  const signalementTypes = ref([])

  /**
   * Assure qu'un utilisateur est connecté
   */
  const ensureAuth = async () => {
    if (!auth.currentUser) {
      console.log('🔐 Connexion anonyme...')
      try {
        await signInAnonymously(auth)
        console.log('✅ Utilisateur anonyme connecté:', auth.currentUser?.uid)
      } catch (err) {
        console.error('❌ Erreur authentification:', err)
        if (err?.code === 'auth/operation-not-allowed') {
          throw new Error("L'authentification anonyme n'est pas activée dans Firebase > Authentication > Sign-in method. Activez-la ou connectez-vous avant de créer un signalement.")
        }
        throw err
      }
    }
  }

  /**
   * Initialise les types de signalement dans Firestore
   */
  const seedSignalementTypes = async () => {
    try {
      const typesRef = collection(db, 'signalementTypes')
      const existingDocs = await getDocs(typesRef)

      if (existingDocs.size > 0) {
        console.log('✅ Types déjà existants:', existingDocs.size)
        return true
      }

      console.log('📝 Création des types...')
      for (const type of SIGNALEMENT_TYPES) {
        await setDoc(doc(typesRef, type.id), type)
        console.log(`✅ Type créé: ${type.libelle}`)
      }
      console.log('✅ Tous les types initialisés')
      return true
    } catch (error) {
      console.error('❌ Erreur seed:', error)
      return false
    }
  }

  /**
   * Charge les types de signalement depuis Firestore
   * Initialise les types s'ils n'existent pas encore
   */
  const loadSignalementTypes = async () => {
    console.log('📂 loadSignalementTypes appelée...')
    isLoading.value = true
    error.value = null

    try {
      // Initialiser si nécessaire
      await seedSignalementTypes()

      const typesRef = collection(db, 'signalementTypes')
      console.log('📡 Récupération des types...')
      const snapshot = await getDocs(typesRef)

      console.log('📊 Snapshot reçu, nombre de docs:', snapshot.size)

      signalementTypes.value = snapshot.docs.map(doc => ({
        id: doc.data().id || doc.id,
        docId: doc.id,
        ...doc.data()
      }))

      console.log('✅ Types chargés:', signalementTypes.value)
      console.log('Nombre de types:', signalementTypes.value.length)
      return signalementTypes.value
    } catch (err) {
      console.error('❌ Erreur lors du chargement des types:', err)
      // Fallback local pour ne pas bloquer l'UI
      signalementTypes.value = SIGNALEMENT_TYPES
      error.value = err.message || 'Erreur lors du chargement des types'
      return signalementTypes.value
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Crée un nouveau signalement dans Firestore
   * @param {Object} data - Données du signalement
   * @returns {Promise<Object>} Référence du document créé
   */
  const createSignalement = async (data) => {
    isLoading.value = true
    error.value = null

    try {
      await ensureAuth()

      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('Vous devez être connecté pour créer un signalement')
      }

      // Valider les données obligatoires
      if (!data.latitude || !data.longitude) {
        throw new Error('La localisation est obligatoire')
      }
      if (!data.typeId) {
        throw new Error('Le type de signalement est obligatoire')
      }
      if (!data.description || data.description.trim().length < 10) {
        throw new Error('La description doit contenir au moins 10 caractères')
      }

      // Valider les champs numériques si remplis
      if (data.surfaceM2 !== null && data.surfaceM2 !== undefined) {
        const surface = parseFloat(data.surfaceM2)
        if (isNaN(surface) || surface < 0) {
          throw new Error('La surface doit être un nombre positif')
        }
      }

      if (data.budget !== null && data.budget !== undefined) {
        const budget = parseFloat(data.budget)
        if (isNaN(budget) || budget < 0) {
          throw new Error('Le budget doit être un nombre positif')
        }
      }

      // Préparer les données du signalement
      const signalementData = {
        // Localisation
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        addressComplement: data.addressComplement || null,

        // Type et description
        typeId: data.typeId,
        description: data.description.trim(),

        // Détails
        surfaceM2: data.surfaceM2 !== null && data.surfaceM2 !== undefined
          ? parseFloat(data.surfaceM2)
          : null,
        budget: data.budget !== null && data.budget !== undefined
          ? parseFloat(data.budget)
          : null,
        entrepriseConcernee: data.entrepriseConcernee || null,

        // Utilisateur
        userId: currentUser.uid,
        userEmail: currentUser.email || null,
        userName: currentUser.displayName || null,
        isAnonymous: data.isAnonymous || false,

        // Photos (en base64)
        photos: (data.photos && data.photos.length > 0)
          ? data.photos.map((photo, index) => ({
            id: `photo_${index}_${Date.now()}`,
            dataUrl: photo.dataUrl || photo,
            uploadedAt: Timestamp.now()
          }))
          : [],

        // Statut
        status: 'nouveau',
        dateSignalement: new Date().toISOString(),

        // Métadonnées Firebase
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Ajouter le document à la collection
      const docRef = await addDoc(collection(db, 'signalements'), signalementData)

      console.log('Signalement créé avec succès:', docRef.id)

      return {
        success: true,
        id: docRef.id,
        data: signalementData
      }
    } catch (err) {
      console.error('Erreur lors de la création du signalement:', err)
      error.value = err.message || 'Erreur lors de la création du signalement'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Récupère les signalements de l'utilisateur actuel
   * @returns {Promise<Array>} Liste des signalements
   */
  const getUserSignalements = async () => {
    isLoading.value = true
    error.value = null

    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('Vous devez être connecté')
      }

      const q = query(
        collection(db, 'signalements'),
        where('userId', '==', currentUser.uid)
      )

      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (err) {
      console.error('Erreur lors de la récupération des signalements:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Récupère un signalement par son ID
   * @param {string} id - ID du signalement
   * @returns {Promise<Object>} Données du signalement
   */
  const getSignalementById = async (id) => {
    isLoading.value = true
    error.value = null

    try {
      const q = query(
        collection(db, 'signalements'),
        where('__name__', '==', id)
      )

      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        throw new Error('Signalement non trouvé')
      }

      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data()
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du signalement:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Récupère les signalements non résolus dans une zone
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radiusKm - Rayon de recherche en km
   * @returns {Promise<Array>} Signalements trouvés
   */
  const getSignalementsByZone = async (lat, lng, radiusKm = 5) => {
    isLoading.value = true
    error.value = null

    try {
      const q = query(
        collection(db, 'signalements'),
        where('status', '==', 'nouveau')
      )

      const snapshot = await getDocs(q)

      // Filtrer par distance (conversion simple)
      const results = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(signalement => {
          const distance = calculateDistance(lat, lng, signalement.latitude, signalement.longitude)
          return distance <= radiusKm
        })

      return results
    } catch (err) {
      console.error('Erreur lors de la recherche par zone:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Calcule la distance entre deux points GPS
   * Formule de Haversine
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Récupère tous les signalements depuis Firestore
   * @returns {Promise<Array>} Signalements trouvés
   */
  const getAllSignalements = async () => {
    isLoading.value = true
    error.value = null

    try {
      const snapshot = await getDocs(collection(db, 'signalements'))
      const results = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(item => !item._isExample)

      return results
    } catch (err) {
      console.error('Erreur lors de la récupération des signalements:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    signalementTypes,
    loadSignalementTypes,
    createSignalement,
    getUserSignalements,
    getSignalementById,
    getSignalementsByZone,
    getAllSignalements
  }
}
