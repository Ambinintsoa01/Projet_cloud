import { db } from '@/services/firebase.service'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'

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

/**
 * Initialise les types de signalement dans Firestore
 * À appeler une seule fois au démarrage ou dans la console
 */
export async function seedSignalementTypes() {
  try {
    const typesRef = collection(db, 'signalementTypes')
    
    // Vérifier si les types existent déjà
    const q = query(typesRef)
    const existingDocs = await getDocs(q)
    
    if (existingDocs.size > 0) {
      console.log('✅ Types de signalement déjà existants dans Firestore')
      return { success: true, message: 'Types already exist', count: existingDocs.size }
    }
    
    // Ajouter les types
    let addedCount = 0
    for (const type of SIGNALEMENT_TYPES) {
      await addDoc(typesRef, type)
      addedCount++
      console.log(`✅ Type ajouté: ${type.libelle}`)
    }
    
    console.log(`✅ ${addedCount} types de signalement ajoutés à Firestore`)
    return { success: true, message: `${addedCount} types added`, count: addedCount }
  } catch (error) {
    console.error('❌ Erreur lors du seed Firebase:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Récupère les types de signalement depuis Firestore
 */
export async function getSignalementTypes() {
  try {
    const typesRef = collection(db, 'signalementTypes')
    const snapshot = await getDocs(typesRef)
    
    if (snapshot.empty) {
      console.warn('⚠️ Aucun type trouvé, initialisation en cours...')
      await seedSignalementTypes()
      return getSignalementTypes() // Récursif pour récupérer les types nouvellement créés
    }
    
    const types = []
    snapshot.forEach(doc => {
      types.push({ ...doc.data(), docId: doc.id })
    })
    
    return types
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des types:', error)
    throw error
  }
}
