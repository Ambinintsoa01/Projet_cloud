/**
 * Utilitaire pour tester les notifications de signalements
 * Utilisez ceci dans la console du navigateur ou dans un composant Vue
 */

import { db, auth } from '@/services/firebase.service'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'

/**
 * Simule un changement de statut pour tester les notifications
 * 
 * Usage dans la console:
 * ```javascript
 * import { testNotification } from '@/utils/testNotifications'
 * await testNotification('en_cours')
 * ```
 * 
 * @param {string} newStatus - Le nouveau statut ('nouveau', 'en_cours', 'termine', 'resolu', 'rejete')
 */
export async function testNotification(newStatus = 'en_cours') {
  try {
    const user = auth.currentUser
    if (!user) {
      console.error('❌ Utilisateur non connecté')
      return { success: false, error: 'Utilisateur non connecté' }
    }

    console.log('🔄 Recherche d\'un signalement de l\'utilisateur...')

    // Trouver un signalement de l'utilisateur
    const signalementsRef = collection(db, 'signalements')
    const q = query(
      signalementsRef,
      where('userId', '==', user.uid)
    )

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      console.warn('⚠️ Aucun signalement trouvé pour cet utilisateur')
      return { 
        success: false, 
        error: 'Aucun signalement trouvé. Créez d\'abord un signalement.' 
      }
    }

    // Prendre le premier signalement
    const signalementDoc = snapshot.docs[0]
    const signalementData = signalementDoc.data()
    const currentStatus = signalementData.status

    console.log('📍 Signalement trouvé:', {
      id: signalementDoc.id,
      statusActuel: currentStatus,
      nouveauStatus: newStatus
    })

    if (currentStatus === newStatus) {
      console.warn('⚠️ Le statut est déjà', newStatus)
      return { 
        success: false, 
        error: `Le statut est déjà "${newStatus}"` 
      }
    }

    // Mettre à jour le statut
    const signalementRef = doc(db, 'signalements', signalementDoc.id)
    await updateDoc(signalementRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    })

    console.log('✅ Statut mis à jour avec succès!')
    console.log(`   ${currentStatus} → ${newStatus}`)
    console.log('🔔 Une notification devrait apparaître...')

    return {
      success: true,
      signalementId: signalementDoc.id,
      oldStatus: currentStatus,
      newStatus: newStatus
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Cycle à travers tous les statuts pour tester toutes les notifications
 * Attend 3 secondes entre chaque changement
 */
export async function testAllNotifications() {
  const statuses = ['nouveau', 'en_cours', 'termine', 'rejete', 'nouveau']
  
  console.log('🔄 Démarrage du cycle de test des notifications...')
  console.log('   Statuts à tester:', statuses.join(' → '))

  for (const status of statuses) {
    console.log(`\n⏳ Changement vers: ${status}`)
    const result = await testNotification(status)
    
    if (result.success) {
      console.log('✅ Test réussi, attente de 3 secondes...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    } else {
      console.error('❌ Test échoué:', result.error)
      break
    }
  }

  console.log('\n🎉 Cycle de test terminé!')
}

/**
 * Affiche tous les signalements de l'utilisateur avec leurs statuts
 */
export async function listMySignalements() {
  try {
    const user = auth.currentUser
    if (!user) {
      console.error('❌ Utilisateur non connecté')
      return
    }

    const signalementsRef = collection(db, 'signalements')
    const q = query(
      signalementsRef,
      where('userId', '==', user.uid)
    )

    const snapshot = await getDocs(q)

    console.log(`\n📋 Mes signalements (${snapshot.size}):`)
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data()
      console.log(`\n${index + 1}. ID: ${doc.id}`)
      console.log(`   Statut: ${data.status}`)
      console.log(`   Description: ${data.description?.substring(0, 50)}...`)
      console.log(`   Créé le: ${data.dateCreation || data.createdAt}`)
    })

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

// Export pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.testNotification = testNotification
  window.testAllNotifications = testAllNotifications
  window.listMySignalements = listMySignalements
  
  console.log('🧪 Fonctions de test de notifications disponibles:')
  console.log('   - testNotification(newStatus) : Change le statut d\'un signalement')
  console.log('   - testAllNotifications() : Cycle à travers tous les statuts')
  console.log('   - listMySignalements() : Affiche vos signalements')
}
