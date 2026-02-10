import { ref, onUnmounted } from 'vue'
import { db, auth } from '@/services/firebase.service'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { toastController } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'

/**
 * Composable pour surveiller les changements de statut des signalements
 * et afficher des notifications en temps réel
 */
export function useSignalementNotifications() {
  const notifications = ref([])
  const unsubscribeCallbacks = []
  const isNativePlatform = Capacitor.isNativePlatform()

  /**
   * Commence à surveiller les signalements de l'utilisateur
   */
  const startListening = () => {
    const user = auth.currentUser
    if (!user) {
      console.warn('⚠️ [NOTIFICATIONS] Utilisateur non connecté, impossible de surveiller les signalements')
      return
    }

    console.log('🔊 [NOTIFICATIONS] Surveillance démarrée pour userId:', user.uid)
    console.log('📧 [NOTIFICATIONS] Email utilisateur:', user.email)

    // Charger les notifications existantes
    loadNotificationsFromStorage()

    // Créer une Map pour stocker l'état précédent des signalements
    const previousStates = new Map()

    // Créer une requête pour les signalements de l'utilisateur
    const signalementsRef = collection(db, 'signalements')
    const q = query(
      signalementsRef,
      where('firebaseUid', '==', user.uid)
    )

    console.log('📡 [NOTIFICATIONS] Query Firestore créée avec firebaseUid:', user.uid)

    // Créer un snapshot listener pour détecter les changements
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('📥 [NOTIFICATIONS] Snapshot reçu, docs:', snapshot.size)
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          console.log(`📄 [NOTIFICATIONS] Signalement trouvé: ${doc.id}`, {
            userId: data.userId,
            status: data.status,
            description: data.description?.substring(0, 30)
          })
        })

        snapshot.docChanges().forEach((change) => {
          const docId = change.doc.id
          const currentData = change.doc.data()

          console.log(`🔄 [NOTIFICATIONS] Change détecté: ${change.type} pour ${docId}`)

          if (change.type === 'modified') {
            // Récupérer l'état précédent depuis notre Map
            const previousData = previousStates.get(docId)

            console.log(`🔍 [NOTIFICATIONS] État précédent:`, previousData?.status)
            console.log(`🔍 [NOTIFICATIONS] État actuel:`, currentData.status)

            // Vérifier si le statut a changé
            if (previousData && currentData.status !== previousData.status) {
              console.log('🔔 [NOTIFICATIONS] Changement de statut détecté:', {
                id: docId,
                ancien: previousData.status,
                nouveau: currentData.status
              })

              // Créer une notification
              const notification = {
                id: `notif_${Date.now()}_${docId}`,
                signalementId: docId,
                title: '📢 Mise à jour de votre signalement',
                message: getStatusChangeMessage(previousData.status, currentData.status),
                oldStatus: previousData.status,
                newStatus: currentData.status,
                timestamp: new Date().toISOString(),
                read: false,
                data: currentData
              }

              // Ajouter à la liste des notifications
              notifications.value.unshift(notification)

              // Limiter à 50 notifications
              if (notifications.value.length > 50) {
                notifications.value = notifications.value.slice(0, 50)
              }

              // Afficher une notification popup
              showNotificationPopup(notification)

              // Sauvegarder dans localStorage
              saveNotificationToStorage(notification)
            } else if (previousData) {
              console.log(`ℹ️ [NOTIFICATIONS] Modification mais pas de changement de statut pour ${docId}`)
            } else {
              console.log(`ℹ️ [NOTIFICATIONS] Première modification détectée pour ${docId}, state enregistré`)
            }

            // Mettre à jour l'état précédent
            previousStates.set(docId, { ...currentData })
          } else if (change.type === 'added') {
            console.log(`➕ [NOTIFICATIONS] Nouveau signalement ajouté: ${docId}`)
            // Stocker l'état initial
            previousStates.set(docId, { ...currentData })
          } else if (change.type === 'removed') {
            console.log(`➖ [NOTIFICATIONS] Signalement supprimé: ${docId}`)
            previousStates.delete(docId)
          }
        })
      },
      (error) => {
        console.error('❌ [NOTIFICATIONS] Erreur surveillance signalements:', error)
        console.error('❌ [NOTIFICATIONS] Error code:', error.code)
        console.error('❌ [NOTIFICATIONS] Error message:', error.message)
      }
    )

    unsubscribeCallbacks.push(unsubscribe)
    console.log('✅ [NOTIFICATIONS] Listener Firestore enregistré')
  }

  /**
   * Arrête la surveillance
   */
  const stopListening = () => {
    unsubscribeCallbacks.forEach(unsubscribe => unsubscribe())
    unsubscribeCallbacks.length = 0
    console.log('🔇 Surveillance des signalements arrêtée')
  }

  /**
   * Génère un message lisible pour le changement de statut
   */
  const getStatusChangeMessage = (oldStatus, newStatus) => {
    const statusLabels = {
      'nouveau': 'Nouveau',
      'en_cours': 'En cours de traitement',
      'termine': 'Terminé',
      'resolu': 'Résolu',
      'rejete': 'Rejeté'
    }

    if (newStatus === 'en_cours') {
      return `✅ Votre signalement est maintenant en cours de traitement`
    } else if (newStatus === 'termine' || newStatus === 'resolu') {
      return `🎉 Votre signalement a été résolu !`
    } else if (newStatus === 'rejete') {
      return `❌ Votre signalement a été rejeté`
    }

    const oldLabel = statusLabels[oldStatus] || oldStatus
    const newLabel = statusLabels[newStatus] || newStatus
    return `Le statut est passé de "${oldLabel}" à "${newLabel}"`
  }

  /**
   * Affiche une notification popup (Toast Ionic)
   */
  const showNotificationPopup = async (notification) => {
    try {
      // Déterminer la couleur selon le type de notification
      let color = 'primary'
      if (notification.newStatus === 'termine' || notification.newStatus === 'resolu') {
        color = 'success'
      } else if (notification.newStatus === 'rejete') {
        color = 'danger'
      } else if (notification.newStatus === 'en_cours') {
        color = 'warning'
      }

      const toast = await toastController.create({
        header: notification.title,
        message: notification.message,
        duration: 5000,
        color: color,
        position: 'top',
        cssClass: 'notification-toast',
        buttons: [
          {
            text: 'Voir',
            role: 'info',
            handler: () => {
              // Déclencher un événement pour naviguer vers le signalement
              const event = new CustomEvent('notification-clicked', {
                detail: notification
              })
              window.dispatchEvent(event)
            }
          },
          {
            text: 'Fermer',
            role: 'cancel'
          }
        ]
      })

      await toast.present()

      // Vibration sur mobile
      if (isNativePlatform && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }

      // Jouer un son (optionnel)
      playNotificationSound()

    } catch (error) {
      console.error('❌ Erreur affichage notification:', error)
    }
  }

  /**
   * Joue un son de notification (optionnel)
   */
  const playNotificationSound = () => {
    try {
      // Créer un beep simple
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      // Ignorer les erreurs de son
    }
  }

  /**
   * Sauvegarde la notification dans le localStorage
   */
  const saveNotificationToStorage = (notification) => {
    try {
      const stored = JSON.parse(localStorage.getItem('app_notifications') || '[]')
      stored.unshift(notification)
      
      // Garder seulement les 100 dernières
      const limited = stored.slice(0, 100)
      localStorage.setItem('app_notifications', JSON.stringify(limited))
    } catch (error) {
      console.error('❌ Erreur sauvegarde notification:', error)
    }
  }

  /**
   * Charge les notifications depuis le localStorage
   */
  const loadNotificationsFromStorage = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('app_notifications') || '[]')
      notifications.value = stored
      return stored
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error)
      return []
    }
  }

  /**
   * Marque une notification comme lue
   */
  const markAsRead = (notificationId) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      
      // Mettre à jour le storage
      localStorage.setItem('app_notifications', JSON.stringify(notifications.value))
    }
  }

  /**
   * Marque toutes les notifications comme lues
   */
  const markAllAsRead = () => {
    notifications.value.forEach(n => n.read = true)
    localStorage.setItem('app_notifications', JSON.stringify(notifications.value))
  }

  /**
   * Supprime une notification
   */
  const deleteNotification = (notificationId) => {
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
    localStorage.setItem('app_notifications', JSON.stringify(notifications.value))
  }

  /**
   * Supprime toutes les notifications
   */
  const clearAllNotifications = () => {
    notifications.value = []
    localStorage.removeItem('app_notifications')
  }

  /**
   * Compte le nombre de notifications non lues
   */
  const unreadCount = () => {
    return notifications.value.filter(n => !n.read).length
  }

  // Nettoyer à la destruction du composant
  onUnmounted(() => {
    stopListening()
  })

  return {
    notifications,
    startListening,
    stopListening,
    loadNotificationsFromStorage,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    unreadCount
  }
}
