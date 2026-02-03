import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import router from './router'
import { seedFirestoreCollections } from './utils/seedProblemes'

// Import des icônes Ionicons
import { addIcons } from 'ionicons'
import {
  map,
  mapOutline,
  list,
  statsChart,
  logIn,
  calendarOutline,
  refresh,
  add,
  remove,
  documentOutline,
  eye,
  wifi,
} from 'ionicons/icons'

// Register icons
addIcons({
  'map': map,
  'map-outline': mapOutline,
  'list': list,
  'stats-chart': statsChart,
  'log-in': logIn,
  'calendar-outline': calendarOutline,
  'refresh': refresh,
  'add': add,
  'remove': remove,
  'document-outline': documentOutline,
  'eye': eye,
  'wifi': wifi,
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

// Import de Leaflet CSS
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

// Initialiser le thème au démarrage
import { storageService } from './services/storage.service'
import './utils/resetPreferences' // Ajoute les utilitaires globaux

const initializeTheme = () => {
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

// Appliquer le thème immédiatement
initializeTheme()

const app = createApp(App)
const pinia = createPinia()

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

app.mount('#app')
