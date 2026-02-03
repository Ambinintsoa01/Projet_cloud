import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api.service'
import { storageService } from '@/services/storage.service'
import { auth } from '@/services/firebase.service'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  // État
  const user = ref(storageService.getUserData())
  const token = ref(storageService.getAuthToken())
  const isAuthenticated = computed(() => !!token.value)
  const isLoading = ref(false)

  // Getters
  const getUser = computed(() => user.value)
  const getToken = computed(() => token.value)

  // Actions
  async function login(email, password) {
    // Vérifier la connexion online - APPLICATION ONLINE-ONLY
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Connexion Internet requise pour se connecter')
    }

    isLoading.value = true

    try {
      const data = await apiService.login(email, password)

      token.value = data.token
      user.value = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.username,
        roles: data.user.roles,
        expiresAt: data.expiresAt
      }

      storageService.setAuthToken(token.value)
      storageService.setUserData(user.value)

      // Connecter l'utilisateur à Firebase Auth avec les mêmes credentials
      try {
        if (!auth.currentUser) {
          await signInWithEmailAndPassword(auth, email, password)
          console.log('✅ Utilisateur connecté à Firebase Auth:', auth.currentUser?.email)
        }
      } catch (firebaseError) {
        console.warn('⚠️ Erreur Firebase Auth (non bloquant):', firebaseError.message)
        // Non bloquant - l'utilisateur peut quand même utiliser l'app backend
      }

      return { success: true }
    } catch (error) {
      const message = error?.data?.message || error?.message || 'Erreur lors de la connexion'
      throw new Error(message)
    } finally {
      isLoading.value = false
    }
  }

  async function register(userData) {
    // Vérifier la connexion online - APPLICATION ONLINE-ONLY
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Connexion Internet requise pour créer un compte')
    }

    isLoading.value = true

    try {
      if (!userData.email || !userData.password || !userData.fullName) {
        throw new Error('Tous les champs sont requis')
      }

      if (userData.password !== userData.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas')
      }

      const data = await apiService.register({
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password
      })

      token.value = data.token
      user.value = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.username,
        roles: data.user.roles,
        expiresAt: data.expiresAt
      }

      storageService.setAuthToken(token.value)
      storageService.setUserData(user.value)

      // Créer l'utilisateur dans Firebase Auth avec les mêmes credentials
      try {
        if (!auth.currentUser) {
          await createUserWithEmailAndPassword(auth, userData.email, userData.password)
          console.log('✅ Utilisateur créé dans Firebase Auth:', auth.currentUser?.email)
        }
      } catch (firebaseError) {
        console.warn('⚠️ Erreur Firebase Auth (non bloquant):', firebaseError.message)
      }

      return { success: true }
    } catch (error) {
      const message = error?.data?.message || error?.message || 'Erreur lors de l\'inscription'
      throw new Error(message)
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    apiService.logout()
    user.value = null
    token.value = null
    
    // Déconnecter aussi de Firebase Auth
    try {
      if (auth.currentUser) {
        await auth.signOut()
        console.log('✅ Déconnecté de Firebase Auth')
      }
    } catch (firebaseError) {
      console.warn('⚠️ Erreur déconnexion Firebase:', firebaseError.message)
    }
  }

  // Initialisation depuis localStorage
  function initializeFromStorage() {
    const storedToken = storageService.getAuthToken()
    const storedUser = storageService.getUserData()

    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = storedUser
    }
  }

  // Initialiser au chargement du store
  initializeFromStorage()

  return {
    // État
    user,
    token,
    isLoading,

    // Getters
    isAuthenticated,
    getUser,
    getToken,

    // Actions
    login,
    register,
    logout,
    initializeFromStorage
  }
})
