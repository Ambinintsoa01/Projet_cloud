/**
 * Script de debug pour les notifications
 * À exécuter dans la console du navigateur
 */

import { auth, db } from '@/services/firebase.service'
import { collection, query, where, getDocs } from 'firebase/firestore'

/**
 * Affiche toutes les informations de debug pour les notifications
 */
export async function debugNotifications() {
  console.log('\n═══════════════════════════════════════════')
  console.log('🔍 DEBUG NOTIFICATIONS - DIAGNOSTIC COMPLET')
  console.log('═══════════════════════════════════════════\n')

  // 1. Vérifier l'utilisateur connecté
  const user = auth.currentUser
  
  console.log('👤 UTILISATEUR CONNECTÉ:')
  if (user) {
    console.log('   ✅ Connecté')
    console.log('   📧 Email:', user.email)
    console.log('   🆔 UID:', user.uid)
    console.log('   👤 Nom:', user.displayName)
  } else {
    console.log('   ❌ PAS CONNECTÉ')
    console.log('   ⚠️ Vous devez être connecté pour recevoir des notifications')
    return
  }

  // 2. Vérifier les signalements dans Firestore
  console.log('\n📊 SIGNALEMENTS DANS FIRESTORE:')
  try {
    const signalementsRef = collection(db, 'signalements')
    const allQuery = query(signalementsRef)
    const allSnapshot = await getDocs(allQuery)
    
    console.log(`   📁 Total signalements: ${allSnapshot.size}`)
    
    // Chercher mes signalements
    const myQuery = query(
      signalementsRef,
      where('userId', '==', user.uid)
    )
    const mySnapshot = await getDocs(myQuery)
    
    console.log(`   👤 Mes signalements: ${mySnapshot.size}`)
    
    if (mySnapshot.size === 0) {
      console.log('   ⚠️ AUCUN signalement trouvé pour cet utilisateur !')
      console.log('   💡 Vérifiez que le champ "userId" dans Firebase correspond à:', user.uid)
      
      // Afficher les 5 premiers signalements pour comparaison
      console.log('\n   📋 Échantillon des signalements (5 premiers):')
      allSnapshot.docs.slice(0, 5).forEach((doc, index) => {
        const data = doc.data()
        console.log(`\n   ${index + 1}. ID: ${doc.id}`)
        console.log(`      userId: "${data.userId}"`)
        console.log(`      status: ${data.status}`)
        console.log(`      description: ${data.description?.substring(0, 40)}...`)
        console.log(`      Correspond? ${data.userId === user.uid ? '✅' : '❌'}`)
      })
    } else {
      console.log('   ✅ Signalements trouvés!\n')
      mySnapshot.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`   ${index + 1}. ID: ${doc.id}`)
        console.log(`      Status: ${data.status}`)
        console.log(`      Description: ${data.description?.substring(0, 40)}`)
        console.log(`      Créé: ${data.createdAt || data.dateSignalement}`)
      })
    }
  } catch (error) {
    console.error('   ❌ Erreur accès Firestore:', error)
  }

  // 3. Vérifier le localStorage
  console.log('\n💾 NOTIFICATIONS STOCKÉES (localStorage):')
  try {
    const stored = JSON.parse(localStorage.getItem('app_notifications') || '[]')
    console.log(`   📦 Notifications en cache: ${stored.length}`)
    if (stored.length > 0) {
      console.log('   📋 Dernières notifications:')
      stored.slice(0, 3).forEach((notif, i) => {
        console.log(`      ${i + 1}. ${notif.title}`)
        console.log(`         ${notif.message}`)
        console.log(`         ${new Date(notif.timestamp).toLocaleString()}`)
      })
    }
  } catch (error) {
    console.error('   ❌ Erreur lecture localStorage:', error)
  }

  // 4. Instructions pour tester
  console.log('\n🧪 COMMENT TESTER:')
  console.log('   1. Copiez l\'UID ci-dessus:', user.uid)
  console.log('   2. Allez dans Firebase Console > Firestore')
  console.log('   3. Trouvez un signalement avec ce userId')
  console.log('   4. Modifiez le champ "status" (ex: nouveau → en_cours)')
  console.log('   5. Une notification devrait apparaître instantanément!')
  
  console.log('\n📝 ALTERNATIVE - Tester avec la fonction:')
  console.log('   await testNotification("en_cours")')
  
  console.log('\n═══════════════════════════════════════════\n')

  return {
    user: {
      uid: user.uid,
      email: user.email
    },
    signalements: {
      total: (await getDocs(query(collection(db, 'signalements')))).size,
      miens: (await getDocs(query(collection(db, 'signalements'), where('userId', '==', user.uid)))).size
    }
  }
}

// Rendre disponible globalement
if (typeof window !== 'undefined') {
  window.debugNotifications = debugNotifications
  console.log('🔍 Debug disponible: tapez "await debugNotifications()" dans la console')
}
