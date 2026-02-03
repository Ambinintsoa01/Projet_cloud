import { db, auth } from '@/services/firebase.service'
import { collection, getDocs, addDoc } from 'firebase/firestore'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'

export async function debugFirebase() {
  console.log('🔍 DEBUG FIREBASE STARTED')

  try {
    // 1. Vérifier l'authentification
    console.log('1️⃣ Vérification de l\'authentification...')
    console.log('Auth instance:', auth)
    console.log('Current user:', auth.currentUser)

    if (!auth.currentUser) {
      console.log('⚠️ Pas d\'utilisateur connecté, connexion anonyme...')
      await signInAnonymously(auth)
      console.log('✅ Authentification anonyme réussie')
      console.log('Current user après login:', auth.currentUser?.uid)
    }

    // 2. Vérifier la base de données
    console.log('\n2️⃣ Vérification de Firestore...')
    console.log('DB instance:', db)

    // 3. Vérifier les types existants
    console.log('\n3️⃣ Récupération des types existants...')
    const typesRef = collection(db, 'signalementTypes')
    const snapshot = await getDocs(typesRef)
    console.log('Nombre de types dans Firestore:', snapshot.size)

    if (snapshot.size > 0) {
      console.log('✅ Types trouvés:')
      snapshot.forEach(doc => {
        console.log(`  - ${doc.data().libelle} (ID: ${doc.id})`)
      })
    } else {
      console.log('❌ Aucun type trouvé, création des types...')

      const TYPES = [
        { id: '1', libelle: 'Problème critique', icon_color: 'red', icon_symbol: '!' },
        { id: '2', libelle: 'Travaux en cours', icon_color: 'purple', icon_symbol: 'car' },
        { id: '3', libelle: 'Problème résolu', icon_color: 'green', icon_symbol: 'check' },
        { id: '4', libelle: 'Alerte signalée', icon_color: 'yellow', icon_symbol: '!' },
        { id: '5', libelle: 'Infrastructure endommagée', icon_color: 'orange', icon_symbol: 'wrench' },
        { id: '6', libelle: "Problème d'inondation", icon_color: 'blue', icon_symbol: 'water' },
        { id: '7', libelle: 'Chaussée dégradée', icon_color: 'red-white', icon_symbol: 'checkered' }
      ]

      for (const type of TYPES) {
        const docRef = await addDoc(typesRef, type)
        console.log(`  ✅ Type créé: ${type.libelle} (Doc ID: ${docRef.id})`)
      }

      console.log('✅ Tous les types ont été créés')
    }

    console.log('\n✅ DEBUG TERMINÉ AVEC SUCCÈS')
    return { success: true, typesCount: snapshot.size }
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error)
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    return { success: false, error: error.message }
  }
}

export function watchAuthState() {
  console.log('👁️ Watching auth state...')
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('✅ User connected:', user.uid)
    } else {
      console.log('❌ User disconnected')
    }
  })
}
