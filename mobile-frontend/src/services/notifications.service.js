import { PushNotifications } from '@capacitor/push-notifications'
import { db, auth } from './firebase.service'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

class NotificationService {
  constructor() {
    this.isInitialized = false
    this.fcmToken = null
    this.listeners = []
  }

  /**
   * Initialise le service de notifications push
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('📱 Service de notifications déjà initialisé')
      return
    }

    // PushNotifications ne fonctionne que sur les appareils mobiles/natifs
    if (!this.isPushNotificationsAvailable()) {
      console.log('ℹ️ Notifications push non disponibles sur cette plateforme (web)')
      this.isInitialized = true
      return true
    }

    try {
      // Vérifier et demander les permissions
      let permStatus = await PushNotifications.checkPermissions()

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions()
      }

      if (permStatus.receive !== 'granted') {
        console.warn('⚠️ Permissions de notifications refusées')
        return false
      }

      // Enregistrer le dispositif pour recevoir les notifications
      await PushNotifications.register()

      // Écouter l'enregistrement réussi
      await PushNotifications.addListener('registration', async (token) => {
        console.log('✅ Token FCM enregistré:', token.value)
        this.fcmToken = token.value
        await this.saveFcmToken(token.value)
      })

      // Écouter les erreurs d'enregistrement
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ Erreur enregistrement FCM:', error)
      })

      // Écouter les notifications reçues quand l'app est au premier plan
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('🔔 Notification reçue (app ouverte):', notification)
        this.handleNotificationReceived(notification)
      })

      // Écouter les actions sur les notifications (tap)
      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('👆 Notification cliquée:', notification)
        this.handleNotificationTapped(notification)
      })

      this.isInitialized = true
      console.log('✅ Service de notifications initialisé avec succès (mobile)')
      return true
    } catch (error) {
      // Capturer l'erreur "plugin is not implemented on web" et autres erreurs
      if (error.message && error.message.includes('not implemented on web')) {
        console.log('ℹ️ Notifications push non disponibles sur le web')
        this.isInitialized = true
        return true
      }
      console.error('❌ Erreur initialisation notifications:', error.message || error)
      // Mark as initialized even on error to avoid repeated attempts
      this.isInitialized = true
      return false
    }
  }

  /**
   * Vérifie si les notifications push sont disponibles sur cette plateforme
   * Retourne true si on est sur mobile/native, false si on est sur le web
   */
  isPushNotificationsAvailable() {
    try {
      // Vérifier si on est dans un environnement Capacitor (mobile/native)
      if (typeof window !== 'undefined' && window.Capacitor) {
        const platform = window.Capacitor.getPlatform ? window.Capacitor.getPlatform() : window.Capacitor.platform
        return platform !== 'web'
      }
      // Si Capacitor n'existe pas, on est sur le web
      return false
    } catch (error) {
      // En cas d'erreur, supposer qu'on est sur le web
      console.debug('Vérification Capacitor échouée:', error.message)
      return false
    }
  }

  /**
   * Sauvegarde le token FCM dans Firestore pour l'utilisateur connecté
   */
  async saveFcmToken(token) {
    try {
      const user = auth.currentUser
      if (!user) {
        console.warn('⚠️ Utilisateur non connecté, impossible de sauvegarder le token')
        return
      }

      const userDocRef = doc(db, 'users', user.uid)
      await setDoc(userDocRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: serverTimestamp(),
        platform: 'android' // ou 'ios' selon la plateforme
      }, { merge: true })

      console.log('✅ Token FCM sauvegardé pour l\'utilisateur:', user.uid)
    } catch (error) {
      console.error('❌ Erreur sauvegarde token FCM:', error)
    }
  }

  /**
   * Gère une notification reçue quand l'app est ouverte
   */
  handleNotificationReceived(notification) {
    // Afficher une notification locale ou un toast
    const event = new CustomEvent('notification-received', {
      detail: notification
    })
    window.dispatchEvent(event)
  }

  /**
   * Gère le tap sur une notification
   */
  handleNotificationTapped(notificationAction) {
    const notification = notificationAction.notification
    
    // Naviguer vers le signalement concerné
    if (notification.data && notification.data.signalementId) {
      const event = new CustomEvent('notification-tapped', {
        detail: {
          signalementId: notification.data.signalementId,
          action: notificationAction.actionId
        }
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * Ajoute un listener pour les événements de notification
   */
  addNotificationListener(eventType, callback) {
    const listener = { eventType, callback }
    this.listeners.push(listener)
    window.addEventListener(eventType, callback)
    return listener
  }

  /**
   * Retire un listener
   */
  removeNotificationListener(listener) {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
      window.removeEventListener(listener.eventType, listener.callback)
    }
  }

  /**
   * Obtient les notifications livrées (non lues)
   */
  async getDeliveredNotifications() {
    try {
      const notifications = await PushNotifications.getDeliveredNotifications()
      return notifications.notifications
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error)
      return []
    }
  }

  /**
   * Supprime toutes les notifications livrées
   */
  async removeAllDeliveredNotifications() {
    try {
      await PushNotifications.removeAllDeliveredNotifications()
      console.log('✅ Toutes les notifications supprimées')
    } catch (error) {
      console.error('❌ Erreur suppression notifications:', error)
    }
  }

  /**
   * Se désabonne des notifications
   */
  async unregister() {
    try {
      await PushNotifications.unregister()
      this.isInitialized = false
      console.log('✅ Désabonné des notifications')
    } catch (error) {
      console.error('❌ Erreur désabonnement:', error)
    }
  }
}

// Export instance singleton
export const notificationService = new NotificationService()
