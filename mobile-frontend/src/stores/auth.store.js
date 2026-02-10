import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storageService } from '@/services/storage.service'
import { auth, db } from '@/services/firebase.service'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', () => {
  // État
  const user = ref(storageService.getUserData())
  const token = ref(null)
  const isAuthReady = ref(false) // Nouveau flag pour savoir si Firebase Auth est prêt
  const isAuthenticated = computed(() => {
    // Vérifier à la fois Firebase Auth ET les données locales
    return !!auth.currentUser || !!user.value
  })
  const isLoading = ref(false)

  // Getters
  const getUser = computed(() => user.value)
  const getToken = computed(() => auth.currentUser?.accessToken || null)

  // Actions
  async function login(email, password) {
    // Vérifier la connexion online - APPLICATION ONLINE-ONLY
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Connexion Internet requise pour se connecter')
    }

    isLoading.value = true

    try {
      // Connexion avec Firebase Auth uniquement
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Récupérer les données utilisateur depuis Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid)
      const userDoc = await getDoc(userDocRef)
      
      let userData = {}
      
      // Si le document n'existe pas, le créer
      if (!userDoc.exists()) {
        console.log('⚠️ Document utilisateur inexistant, création...')
        userData = {
          fullName: firebaseUser.displayName || 'Utilisateur',
          email: firebaseUser.email,
          roles: ['USER'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        try {
          await setDoc(userDocRef, userData)
          console.log('✅ Document utilisateur créé dans Firestore')
        } catch (setDocError) {
          console.warn('⚠️ Impossible de créer le document utilisateur:', setDocError)
          // Continuer même si la création échoue
        }
      } else {
        userData = userDoc.data()
      }

      user.value = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        fullName: userData.fullName || firebaseUser.displayName || 'Utilisateur',
        roles: userData.roles || ['USER'],
        createdAt: userData.createdAt || new Date().toISOString()
      }

      storageService.setUserData(user.value)
      console.log('✅ Utilisateur connecté à Firebase Auth:', firebaseUser.email)

      return { success: true }
    } catch (error) {
      console.error('❌ Erreur de connexion:', error)
      const message = error?.message || 'Erreur lors de la connexion'
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

      // Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      )
      const firebaseUser = userCredential.user

      // Mettre à jour le profil
      await updateProfile(firebaseUser, {
        displayName: userData.fullName
      })

      // Créer le document utilisateur dans Firestore
      const userProfile = {
        fullName: userData.fullName,
        email: userData.email,
        roles: ['USER'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile)

      user.value = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        fullName: userData.fullName,
        roles: ['USER'],
        createdAt: userProfile.createdAt
      }

      storageService.setUserData(user.value)
      console.log('✅ Utilisateur créé dans Firebase Auth:', firebaseUser.email)

      return { success: true }
    } catch (error) {
      const message = error?.message || 'Erreur lors de l\'inscription'
      throw new Error(message)
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await auth.signOut()
      user.value = null
      token.value = null
      storageService.removeAuthToken()
      storageService.removeUserData()
      console.log('✅ Déconnecté de Firebase Auth')
    } catch (error) {
      console.warn('⚠️ Erreur déconnexion Firebase:', error.message)
      throw error
    }
  }

  // Initialisation depuis localStorage
  function initializeFromStorage() {
    const storedUser = storageService.getUserData()

    if (storedUser && auth.currentUser) {
      user.value = storedUser
    }
  }

  // Observer l'état d'authentification Firebase
  onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (firebaseUser) {
        // Utilisateur connecté - récupérer les données depuis Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid)
          const userDoc = await getDoc(userDocRef)
          
          let userData = {}
          
          // Si le document n'existe pas, le créer
          if (!userDoc.exists()) {
            console.log('⚠️ onAuthStateChanged: Document utilisateur inexistant, création...')
            userData = {
              fullName: firebaseUser.displayName || 'Utilisateur',
              email: firebaseUser.email,
              roles: ['USER'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            try {
              await setDoc(userDocRef, userData)
              console.log('✅ Document utilisateur créé dans Firestore')
            } catch (setDocError) {
              console.warn('⚠️ Impossible de créer le document utilisateur:', setDocError)
            }
          } else {
            userData = userDoc.data()
          }

          user.value = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            fullName: userData.fullName || firebaseUser.displayName || 'Utilisateur',
            roles: userData.roles || ['USER'],
            createdAt: userData.createdAt || new Date().toISOString()
          }
          
          storageService.setUserData(user.value)
        } catch (error) {
          console.warn('⚠️ Erreur récupération données utilisateur:', error.message)
          // En cas d'erreur, utiliser les données de Firebase Auth
          user.value = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            fullName: firebaseUser.displayName || 'Utilisateur',
            roles: ['USER'],
            createdAt: new Date().toISOString()
          }
          storageService.setUserData(user.value)
        }
      } else {
        // Utilisateur déconnecté - vérifier le localStorage
        const storedUser = storageService.getUserData()
        if (!storedUser) {
          user.value = null
          token.value = null
        }
      }
    } catch (error) {
      console.error('❌ Erreur critique dans onAuthStateChanged:', error)
    } finally {
      // Toujours marquer que Firebase Auth est prêt, même en cas d'erreur
      isAuthReady.value = true
    }
  })

  // Initialiser au chargement du store
  initializeFromStorage()

  return {
    // État
    user,
    token,
    isLoading,
    isAuthReady,

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

