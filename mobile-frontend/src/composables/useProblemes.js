import { ref } from 'vue'
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '@/services/firebase.service'
import { useAuthStore } from '@/stores/auth.store'

export function useProblemes() {
  const isLoading = ref(false)
  const error = ref(null)
  const problemes = ref([])
  const authStore = useAuthStore()

  /**
   * Assure que l'utilisateur est connecté
   * Utilise OBLIGATOIREMENT l'ID utilisateur du backend (authStore)
   */
  const ensureAuth = async () => {
    // Vérifier que l'utilisateur est connecté au backend
    if (!authStore.user?.id) {
      console.error('❌ Utilisateur non connecté au backend')
      throw new Error('Veuillez vous connecter d\'abord')
    }

    console.log('✅ Utilisation de l\'ID utilisateur backend:', authStore.user.id)
    
    // Optionnel : vérifier que Firebase Auth est aussi connecté
    if (!auth.currentUser) {
      try {
        // Connecter à Firebase avec les mêmes credentials si disponibles
        if (authStore.user?.email) {
          console.log('🔐 Connexion Firebase Auth avec email:', authStore.user.email)
          // Note: On ne peut pas accéder au mot de passe, donc on compte sur signInWithEmailAndPassword
          // qui devrait déjà être fait lors du login du store
        }
      } catch (err) {
        console.warn('⚠️ Firebase Auth non connecté (non bloquant):', err.message)
      }
    }

    return { uid: authStore.user.id.toString() }
  }

  /**
   * Crée un nouveau problème dans Firestore
   * @param {Object} data - Données du problème
   * @returns {Promise<Object>} Le problème créé
   */
  const createProbleme = async (data) => {
    isLoading.value = true
    error.value = null

    try {
      // S'assurer que l'utilisateur est authentifié (OBLIGATOIRE)
      const currentUser = await ensureAuth()
      const userId = currentUser.uid
      
      const problemeData = {
        userId: parseInt(userId), // Assurer que c'est un nombre
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        typeId: data.typeId || null,
        status: 'ouvert',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      console.log('📝 Création du problème avec userId:', userId)
      console.log('📋 Données:', problemeData)

      const problemesRef = collection(db, 'problemes')
      const docRef = await addDoc(problemesRef, problemeData)

      console.log('✅ Problème créé avec ID Firestore:', docRef.id)

      return {
        id: docRef.id,
        ...problemeData,
        success: true
      }
    } catch (err) {
      console.error('❌ Erreur création problème:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Récupère tous les problèmes
   * @returns {Promise<Array>} Liste des problèmes
   */
  const listProblemes = async () => {
    isLoading.value = true
    error.value = null

    try {
      const problemesRef = collection(db, 'problemes')
      const q = query(problemesRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      problemes.value = snapshot.docs
        .filter(doc => !doc.data()._isExample) // Exclure les exemples
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || null,
          updatedAt: doc.data().updatedAt?.toDate?.() || null
        }))

      console.log('✅ Problèmes chargés:', problemes.value.length)
      return problemes.value
    } catch (err) {
      console.error('❌ Erreur chargement problèmes:', err)
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Récupère les problèmes ouverts (pour les managers)
   * @returns {Promise<Array>} Liste des problèmes ouverts
   */
  const listOpenProblemes = async () => {
    isLoading.value = true
    error.value = null

    try {
      const problemesRef = collection(db, 'problemes')
      const q = query(
        problemesRef,
        where('status', '==', 'ouvert'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)

      const openProblemes = snapshot.docs
        .filter(doc => !doc.data()._isExample)
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || null,
          updatedAt: doc.data().updatedAt?.toDate?.() || null
        }))

      console.log('✅ Problèmes ouverts:', openProblemes.length)
      return openProblemes
    } catch (err) {
      console.error('❌ Erreur chargement problèmes ouverts:', err)
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Récupère les problèmes de l'utilisateur connecté
   * @returns {Promise<Array>} Liste des problèmes de l'utilisateur
   */
  const listMyProblemes = async () => {
    isLoading.value = true
    error.value = null

    try {
      const userId = authStore.user?.id || auth.currentUser?.uid
      if (!userId) {
        console.warn('⚠️ Utilisateur non connecté')
        return []
      }

      const problemesRef = collection(db, 'problemes')
      const q = query(
        problemesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)

      const myProblemes = snapshot.docs
        .filter(doc => !doc.data()._isExample)
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || null,
          updatedAt: doc.data().updatedAt?.toDate?.() || null
        }))

      console.log('✅ Mes problèmes:', myProblemes.length)
      return myProblemes
    } catch (err) {
      console.error('❌ Erreur chargement mes problèmes:', err)
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Convertit un problème en signalement (pour les managers)
   * @param {string} problemeId - ID du problème
   * @param {Object} conversionData - Données de conversion
   * @returns {Promise<Object>} Le signalement créé
   */
  const convertProbleme = async (problemeId, conversionData) => {
    isLoading.value = true
    error.value = null

    try {
      const userId = authStore.user?.id || auth.currentUser?.uid || 'anonymous'

      // 1. Récupérer le problème
      const problemeRef = doc(db, 'problemes', problemeId)
      const problemeDoc = await getDoc(problemeRef)

      if (!problemeDoc.exists()) {
        throw new Error('Problème introuvable')
      }

      const problemeData = problemeDoc.data()

      // 2. Créer le signalement
      const signalementData = {
        latitude: problemeData.latitude,
        longitude: problemeData.longitude,
        typeId: conversionData.typeId,
        description: conversionData.description || problemeData.description,
        surfaceM2: conversionData.surfaceM2 || null,
        budget: conversionData.budget || null,
        entrepriseConcernee: conversionData.entrepriseConcernee || null,
        isAnonymous: false,
        status: 'nouveau',
        userId,
        createdBy: 'conversion',
        problemeId: problemeId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const signalementsRef = collection(db, 'signalements')
      const signalementDocRef = await addDoc(signalementsRef, signalementData)

      console.log('✅ Signalement créé:', signalementDocRef.id)

      // 3. Mettre à jour le problème (status = converti)
      await updateDoc(problemeRef, {
        status: 'converti',
        signalementId: signalementDocRef.id,
        updatedAt: serverTimestamp()
      })

      console.log('✅ Problème marqué comme converti')

      return {
        id: signalementDocRef.id,
        ...signalementData,
        success: true
      }
    } catch (err) {
      console.error('❌ Erreur conversion problème:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Rejette un problème (pour les managers)
   * @param {string} problemeId - ID du problème
   * @param {string} reason - Raison du rejet (optionnel)
   * @returns {Promise<void>}
   */
  const rejectProbleme = async (problemeId, reason = null) => {
    isLoading.value = true
    error.value = null

    try {
      const problemeRef = doc(db, 'problemes', problemeId)
      await updateDoc(problemeRef, {
        status: 'rejete',
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      })

      console.log('✅ Problème rejeté')
    } catch (err) {
      console.error('❌ Erreur rejet problème:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    problemes,
    createProbleme,
    listProblemes,
    listOpenProblemes,
    listMyProblemes,
    convertProbleme,
    rejectProbleme
  }
}
