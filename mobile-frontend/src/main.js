import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import { createRouter, createWebHistory } from 'vue-router'
import { defineCustomElements } from '@ionic/pwa-elements/loader'
import App from './App.vue'
import router from './router'
import { seedFirestoreCollections } from './utils/seedProblemes'

// Import des icônes Ionicons
import { addIcons } from 'ionicons'
import {
  map,
  mapOutline,
  list,
  listOutline,
  statsChart,
  statsChartOutline,
  logIn,
  logInOutline,
  calendarOutline,
  refresh,
  add,
  remove,
  documentOutline,
  document,
  eye,
  eyeOff,
  wifi,
  cloudOffline,
  cloudUpload,
  checkmarkCircle,
  checkmarkCircleOutline,
  trash,
  time,
  server,
  sync,
  filter,
  person,
  personAddOutline,
  search,
  image,
  location,
  chevronForward,
  arrowBack,
  arrowForward,
  close,
  checkmark,
  locate,
  informationCircle,
  send,
  personOutline,
  lockClosed,
  lockClosedOutline,
  mailOutline,
} from 'ionicons/icons'

// Register icons
addIcons({
  'map': map,
  'map-outline': mapOutline,
  'list': list,
  'list-outline': listOutline,
  'stats-chart': statsChart,
  'stats-chart-outline': statsChartOutline,
  'log-in': logIn,
  'log-in-outline': logInOutline,
  'calendar-outline': calendarOutline,
  'refresh': refresh,
  'add': add,
  'remove': remove,
  'document-outline': documentOutline,
  'document': document,
  'eye': eye,
  'eye-off': eyeOff,
  'wifi': wifi,
  'cloud-offline': cloudOffline,
  'cloud-upload': cloudUpload,
  'checkmark-circle': checkmarkCircle,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'trash': trash,
  'time': time,
  'server': server,
  'sync': sync,
  'filter': filter,
  'person': person,
  'person-add-outline': personAddOutline,
  'search': search,
  'image': image,
  'location': location,
  'chevron-forward': chevronForward,
  'arrow-back': arrowBack,
  'arrow-forward': arrowForward,
  'close': close,
  'checkmark': checkmark,
  'locate': locate,
  'information-circle': informationCircle,
  'send': send,
  'person-outline': personOutline,
  'lock-closed': lockClosed,
  'lock-closed-outline': lockClosedOutline,
  'mail-outline': mailOutline,
})

// Import des styles Ionic
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

// Import des styles Ionic optionnels
import '@ionic/vue/css/palettes/dark.system.css'

// Import du thème personnalisé
import './theme/variables.css'
import './theme/app-styles.css'
import './theme/notification-styles.css'

// Import de Leaflet CSS
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

// Import du service de notifications
import { notificationService } from './services/notifications.service'
import { useSignalementNotifications } from './composables/useSignalementNotifications'
import { auth } from './services/firebase.service'
import { onAuthStateChanged } from 'firebase/auth'

// Import des fonctions de test (développement uniquement)
import './utils/testNotifications'
import './utils/debugNotifications'

// Initialiser le thème au démarrage
import { storageService } from './services/storage.service'
import './utils/resetPreferences' // Ajoute les utilitaires globaux

const initializeTheme = () => {
  // Vérifier que document.documentElement est disponible
  if (!document || !document.documentElement) {
    console.warn('⚠️ document.documentElement non disponible, thème non initialisé')
    return
  }

  const preferences = storageService.getUserPreferences()
  
  console.log('🎨 Préférences au démarrage:', preferences)
  
  // Toujours démarrer en mode clair sauf si darkMode est explicitement true
  if (preferences.darkMode === true) {
    document.documentElement.classList.add('ion-palette-dark')
    console.log('🌙 Mode sombre activé au démarrage')
  } else {
    document.documentElement.classList.remove('ion-palette-dark')
    console.log('☀️ Mode clair activé au démarrage (par défaut)')
  }
}

// Appliquer le thème immédiatement si le DOM est prêt, sinon attendre
if (document && document.documentElement) {
  initializeTheme()
} else {
  // Attendre que le DOM soit chargé
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', initializeTheme)
  }
}

const app = createApp(App)
const pinia = createPinia()

// Initialiser PWA Elements pour la caméra web
defineCustomElements(window)

app.use(pinia)
app.use(IonicVue, {
  mode: 'md', // Mode Material Design pour Android
  swipeBackEnabled: true,
})
app.use(router)

// Initialiser les collections Firestore au démarrage (silencieusement, non-bloquant)
seedFirestoreCollections()
  .then((result) => {
    if (result.success) {
      console.log('✅ Collections Firestore initialisées:', result)
    }
  })
  .catch((error) => {
    // Silencieux - les permissions Firestore peuvent bloquer ceci
    console.debug('ℹ️ Initialisation Firestore non disponible:', error?.message)
  })

// Initialiser les notifications push quand l'utilisateur se connecte
let notificationListenerActive = false
let notificationCleanup = null

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('👤 [MAIN] Utilisateur connecté:', user.uid, user.email)
    try {
      // Initialiser le service de notifications locales
      await notificationService.initialize()
      console.log('✅ [MAIN] Service de notifications locales initialisé')
      
      // Initialiser Firebase Cloud Messaging (FCM) pour les notifications push
      const { default: fcmService } = await import('@/services/fcm.service')
      await fcmService.initialize()
      console.log('✅ [MAIN] FCM initialisé - notifications push actives')
      
      // Démarrer la surveillance des changements de statut
      // IMPORTANT : Ne démarre QUE si pas déjà actif
      if (!notificationListenerActive) {
        console.log('🚀 [MAIN] Démarrage de la surveillance des signalements...')
        const { startListening, stopListening } = useSignalementNotifications()
        startListening()
        notificationListenerActive = true
        notificationCleanup = stopListening
        console.log('✅ [MAIN] Surveillance des signalements activée')
      } else {
        console.log('ℹ️ [MAIN] Surveillance déjà active, skip')
      }
    } catch (error) {
      console.error('❌ [MAIN] Erreur initialisation notifications:', error)
    }
  } else {
    console.log('👤 [MAIN] Utilisateur déconnecté')
    
    // Cleanup FCM
    try {
      const { default: fcmService } = await import('@/services/fcm.service')
      await fcmService.removeFCMToken()
    } catch (error) {
      console.debug('ℹ️ [MAIN] Erreur cleanup FCM:', error)
    }
    
    if (notificationCleanup) {
      notificationCleanup()
      notificationCleanup = null
    }
    notificationListenerActive = false
  }
})

app.mount('#app')

// Appliquer le thème une fois que l'app est montée (pour être sûr)
if (document && document.documentElement) {
  initializeTheme()
}
