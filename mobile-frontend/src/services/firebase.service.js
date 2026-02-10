import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Configuration Firebase - Valeurs codées en dur pour compatibilité mobile
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyARVOSnVCyYWmLMTxj8P2k7ki5R_jZvcKM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'cloud-cc4c5.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'cloud-cc4c5',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'cloud-cc4c5.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '552304258962',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:552304258962:web:f9bf887101da361bea9b4b'
}

console.log('🔥 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey
})

// Initialiser Firebase
const app = initializeApp(firebaseConfig)

// Initialiser les services Firebase
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Configuration Firestore pour améliorer la connectivité
db.settings = {
  cacheSizeBytes: 100000000, // 100 MB
  experimentalForceLongPolling: true, // Force long polling au lieu de WebChannel
  experimentalAutoDetectLongPolling: true
}

// Mode développement : utiliser les émulateurs si disponibles
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  console.log('🔧 Connexion aux émulateurs Firebase...')
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, 'localhost', 8080)
    console.log('✅ Émulateurs Firebase connectés')
  } catch (error) {
    console.warn('⚠️ Erreur connexion émulateurs:', error)
  }
}

export default app
