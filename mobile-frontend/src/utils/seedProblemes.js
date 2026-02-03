import { collection, setDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase.service'

/**
 * Initialise les collections Firestore pour les problèmes et signalements
 * Note: Peut échouer si les permissions Firestore refusent l'accès
 */
export async function seedFirestoreCollections() {
  console.log('🌱 Initialisation des collections Firestore...')

  try {
    // 1. Vérifier la collection "problemes"
    const problemesRef = collection(db, 'problemes')
    const problemesSnapshot = await getDocs(problemesRef)
    console.log('✅ Collection "problemes" vérifiée:', problemesSnapshot.size, 'documents')

    // 2. Vérifier la collection "signalements"
    const signalementsRef = collection(db, 'signalements')
    const signalementsSnapshot = await getDocs(signalementsRef)
    console.log('✅ Collection "signalements" vérifiée:', signalementsSnapshot.size, 'documents')

    // 3. Vérifier la collection "signalementTypes"
    const typesRef = collection(db, 'signalementTypes')
    const typesSnapshot = await getDocs(typesRef)
    console.log('✅ Collection "signalementTypes" vérifiée:', typesSnapshot.size, 'types')

    return {
      success: true,
      problemes: problemesSnapshot.size,
      signalements: signalementsSnapshot.size,
      types: typesSnapshot.size
    }
  } catch (error) {
    // Ignorer les erreurs de permission - utilisateurs visiteurs n'ont pas accès à Firestore
    if (error.code === 'permission-denied') {
      console.debug('ℹ️ Accès Firestore limité (utilisateur visiteur ou permissions insuffisantes)')
      return {
        success: false,
        error: error.message,
        isPermissionDenied: true
      }
    }
    
    console.error('❌ Erreur lors de l\'initialisation:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Structure des documents Firestore
 * 
 * Collection: problemes
 * {
 *   userId: string,           // ID de l'utilisateur qui a créé le problème
 *   latitude: number,          // Latitude
 *   longitude: number,         // Longitude
 *   description: string,       // Description du problème (10-300 chars)
 *   typeId: string | null,     // Type suggéré (optionnel)
 *   status: string,            // 'ouvert' | 'converti' | 'rejete'
 *   createdAt: Timestamp,      // Date de création
 *   updatedAt: Timestamp,      // Date de mise à jour
 *   signalementId: string      // ID du signalement créé (si converti)
 * }
 * 
 * Collection: signalements
 * {
 *   latitude: number,
 *   longitude: number,
 *   typeId: string,            // Type requis
 *   description: string,       // Description détaillée
 *   surfaceM2: number | null,  // Surface affectée (optionnel)
 *   budget: number | null,     // Budget estimé (optionnel)
 *   entrepriseConcernee: string | null,
 *   isAnonymous: boolean,
 *   status: string,            // 'nouveau' | 'en_cours' | 'resolu' | 'ferme'
 *   userId: string,            // ID du manager qui a créé
 *   createdBy: string,         // 'user' | 'manager' | 'conversion'
 *   problemeId: string,        // ID du problème d'origine (si conversion)
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   photos: array              // URLs des photos (optionnel)
 * }
 */
