import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { db, auth } from './firebase.service'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

/**
 * Service de gestion des notifications push avec Firebase Cloud Messaging
 * UNIQUEMENT pour les plateformes natives (Android/iOS)
 */
class FCMService {
  constructor() {
    this.isInitialized = false
    this.fcmToken = null
  }

  /**
   * Initialise FCM pour les plateformes natives uniquement
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('📱 [FCM] Déjà initialisé')
      return
    }

    const isNative = Capacitor.isNativePlatform()
    
    if (!isNative) {
      console.log('🌐 [FCM] Plateforme web - notifications push désactivées (uniquement toasts)')
      return
    }

    console.log('📱 [FCM] Initialisation des notifications push natives')

    try {
      const user = auth.currentUser
      if (!user) {
        console.warn('⚠️ [FCM] Utilisateur non connecté, initialisation annulée')
        return
      }

      await this.initializeNative()
      this.isInitialized = true
      console.log('✅ [FCM] Notifications push natives activées')
    } catch (error) {
      console.error('❌ [FCM] Erreur lors de l\'initialisation:', error)
      throw error
    }
  }

  /**
   * Initialisation pour les plateformes natives (Android/iOS)
   */
  async initializeNative() {
    console.log('📱 [FCM] Configuration native Android/iOS')

    // Demander la permission
    const permStatus = await PushNotifications.checkPermissions()
    console.log('🔐 [FCM] Permissions actuelles:', permStatus.receive)

    if (permStatus.receive === 'prompt') {
      const permRequest = await PushNotifications.requestPermissions()
      console.log('🔐 [FCM] Permissions accordées:', permRequest.receive)
      
      if (permRequest.receive !== 'granted') {
        throw new Error('Permission de notification refusée')
      }
    }

    // Créer le canal de notification pour Android
    await PushNotifications.createChannel({
      id: 'signalements',
      name: 'Signalements',
      description: 'Notifications pour les changements de statut des signalements',
      importance: 5,
      visibility: 1,
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#3b82f6'
    })

    // Enregistrer l'appareil
    await PushNotifications.register()
    console.log('📝 [FCM] Appareil enregistré')

    // Écouter l'événement de réception du token
    await PushNotifications.addListener('registration', async (token) => {
      console.log('🔑 [FCM] Token FCM reçu:', token.value.substring(0, 50) + '...')
      this.fcmToken = token.value
      await this.saveFCMTokenToFirestore(token.value)
    })

    // Écouter les erreurs d'enregistrement
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ [FCM] Erreur d\'enregistrement:', error)
    })

    // Écouter les notifications reçues quand l'app est ouverte
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('🔔 [FCM] Notification reçue (app au premier plan):', {
        title: notification.title,
        body: notification.body,
        data: notification.data
      })
      this.handleForegroundNotification(notification)
    })

    // Écouter les clics sur les notifications
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('👆 [FCM] Notification cliquée:', notification)
      this.handleNotificationClick(notification)
    })

    console.log('✅ [FCM] Tous les listeners enregistrés')
  }

  /**
   * Sauvegarde le token FCM dans Firestore
   */
  async saveFCMTokenToFirestore(token) {
    try {
      const user = auth.currentUser
      if (!user) {
        console.warn('⚠️ [FCM] Utilisateur non connecté, token non sauvegardé')
        return
      }

      const userRef = doc(db, 'users', user.uid)
      await setDoc(userRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: serverTimestamp(),
        platform: Capacitor.getPlatform(),
        lastActive: serverTimestamp()
      }, { merge: true })

      console.log('💾 [FCM] Token sauvegardé dans Firestore pour userId:', user.uid)
    } catch (error) {
      console.error('❌ [FCM] Erreur sauvegarde token:', error)
    }
  }

  /**
   * Gère les notifications reçues quand l'app est au premier plan
   */
  handleForegroundNotification(notification) {
    console.log('🔔 [FCM] Traitement notification au premier plan')
    
    // Sur mobile, afficher simplement un log
    // La notification toast sera gérée par useSignalementNotifications
    console.log('📢 [FCM] Notification:', notification.title, '-', notification.body)
  }

  /**
   * Gère le clic sur une notification
   */
  handleNotificationClick(notification) {
    console.log('👆 [FCM] Clic sur notification:', notification)
    
    // Récupérer l'ID du signalement depuis les données de la notification
    const signalementId = notification.notification?.data?.signalementId
    
    if (signalementId) {
      // Rediriger vers la page de détails du signalement
      console.log('📍 [FCM] Redirection vers signalement:', signalementId)
      
      // TODO: Implémenter la navigation
      // Par exemple: router.push(`/signalement/${signalementId}`)
    }
  }

  /**
   * Supprime le token FCM (lors de la déconnexion)
   */
  async removeFCMToken() {
    try {
      const user = auth.currentUser
      if (!user) return

      const userRef = doc(db, 'users', user.uid)
      await setDoc(userRef, {
        fcmToken: null,
        fcmTokenUpdatedAt: serverTimestamp()
      }, { merge: true })

      console.log('🗑️ [FCM] Token supprimé de Firestore')

      // Désinscrire l'appareil
      if (Capacitor.isNativePlatform()) {
        await PushNotifications.removeAllListeners()
      }

      this.fcmToken = null
      this.isInitialized = false
    } catch (error) {
      console.error('❌ [FCM] Erreur suppression token:', error)
    }
  }

  /**
   * Récupère le token FCM actuel
   */
  getFCMToken() {
    return this.fcmToken
  }
}

// Export de l'instance unique
export const fcmService = new FCMService()
export default fcmService
