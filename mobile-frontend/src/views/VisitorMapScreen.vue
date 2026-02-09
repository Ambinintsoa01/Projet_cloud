<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="visitor-toolbar">
        <ion-title>
          <span class="app-logo">ROAD ALERT</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="visitor-map-content">
      <!-- CARTE PLEIN ÉCRAN -->
      <div v-show="currentView === 'map'" class="map-section">
        <div ref="mapContainer" class="map-container"></div>

        <!-- Contrôles de zoom personnalisés -->
        <div class="map-controls">
          <ion-button fill="solid" shape="round" @click="zoomIn" class="control-button">
            <ion-icon name="add"></ion-icon>
          </ion-button>
          <ion-button fill="solid" shape="round" @click="zoomOut" class="control-button">
            <ion-icon name="remove"></ion-icon>
          </ion-button>
        </div>

        <!-- Bouton d'actualisation -->
        <div class="refresh-button-container">
          <ion-button fill="solid" shape="round" @click="refreshData" class="refresh-button">
            <ion-icon name="refresh"></ion-icon>
          </ion-button>
        </div>

        <!-- Indicateur de chargement -->
        <div v-if="isLoading" class="loading-overlay">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Chargement de la carte...</p>
        </div>
      </div>

      <!-- VUE TABLEAU -->
      <div v-show="currentView === 'table'" class="table-section">
        <div class="table-header">
          <h3>{{ signalements.length }} signalement(s)</h3>
        </div>

        <div v-if="signalements.length === 0" class="empty-state">
          <ion-icon name="document-outline" size="large" color="medium"></ion-icon>
          <p>Aucun signalement</p>
        </div>

        <ion-list v-else class="signalements-list">
          <ion-item v-for="signalement in signalements" :key="signalement.id || signalement.firebaseId" class="signalement-item">
            <ion-label class="item-content">
              <div class="item-header">
                <div class="item-type">
                  <span class="type-emoji">{{ getTypeEmoji(signalement) }}</span>
                  <span class="type-label">{{ getTypeLabel(signalement) }}</span>
                </div>
                <span class="item-status" :style="{ backgroundColor: getStatusColor(signalement.status) }">
                  {{ getStatusLabel(signalement.status) }}
                </span>
              </div>
              <p class="item-description">{{ signalement.description || 'Aucune description' }}</p>
              <p class="item-date">
                <ion-icon name="calendar-outline"></ion-icon>
                {{ formatDate(signalement.dateCreation || signalement.createdAt) }}
              </p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>

      <!-- VUE STATS -->
      <div v-show="currentView === 'stats'" class="stats-section">
        <div class="stats-header">
          <h3>Statistiques</h3>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ signalements.length }}</div>
            <div class="stat-label">Total</div>
            <div class="stat-icon">📍</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ getStatusCount('nouveau') }}</div>
            <div class="stat-label">Nouveaux</div>
            <div class="stat-icon">🔴</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ getStatusCount('en_cours') }}</div>
            <div class="stat-label">En cours</div>
            <div class="stat-icon">🟡</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ getStatusCount('termine') }}</div>
            <div class="stat-label">Terminés</div>
            <div class="stat-icon">🟢</div>
          </div>
        </div>

        <div class="legend-section">
          <h4>Légende des types</h4>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-emoji">⚠️</span>
              <span class="legend-text">Problème critique</span>
            </div>
            <div class="legend-item">
              <span class="legend-emoji">🚗</span>
              <span class="legend-text">Travaux en cours</span>
            </div>
            <div class="legend-item">
              <span class="legend-emoji">✓</span>
              <span class="legend-text">Problème résolu</span>
            </div>
            <div class="legend-item">
              <span class="legend-emoji">🔧</span>
              <span class="legend-text">Infrastructure endommagée</span>
            </div>
            <div class="legend-item">
              <span class="legend-emoji">💧</span>
              <span class="legend-text">Problème d'inondation</span>
            </div>
            <div class="legend-item">
              <span class="legend-emoji">🏁</span>
              <span class="legend-text">Chaussée dégradée</span>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Navigation bar en bas -->
    <ion-footer class="visitor-nav-footer">
      <ion-toolbar class="visitor-nav-bar">
        <div class="nav-buttons">
          <div 
            :class="{ active: currentView === 'map' }"
            @click="currentView = 'map'"
            class="nav-btn"
          >
            <ion-icon :icon="mapOutline" class="nav-icon"></ion-icon>
          </div>
          <div 
            :class="{ active: currentView === 'table' }"
            @click="currentView = 'table'"
            class="nav-btn"
          >
            <ion-icon :icon="listOutline" class="nav-icon"></ion-icon>
          </div>
          <div 
            :class="{ active: currentView === 'stats' }"
            @click="currentView = 'stats'"
            class="nav-btn"
          >
            <ion-icon :icon="statsChartOutline" class="nav-icon"></ion-icon>
          </div>
          <router-link to="/login" class="nav-btn login-btn nav-link">
            <ion-icon :icon="logInOutline" class="nav-icon"></ion-icon>
          </router-link>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonList,
  IonItem,
  IonFooter,
  toastController
} from '@ionic/vue'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet.markercluster'
import { useReportsStore } from '@/stores/reports.store'
import {
  mapOutline,
  listOutline,
  statsChartOutline,
  logInOutline
} from 'ionicons/icons'

// État réactif
const mapContainer = ref(null)
let map = null
let markersLayer = null
let markerClusterGroup = null

const signalements = ref([])
const isLoading = ref(true)
const currentView = ref('map')

// Fonctions de conversion d'icônes et couleurs
const getIconSymbol = (iconSymbol) => {
  if (!iconSymbol) return null
  const symbols = {
    '!': '⚠️',
    'car': '🚗',
    'check': '✓',
    'wrench': '🔧',
    'water': '💧',
    'checkered': '🏁',
  }
  return symbols[iconSymbol] || iconSymbol
}

const normalizeTypeId = (value) => {
  if (value == null) return null
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const getTypeEmoji = (signalement, fallbackTypeId = null) => {
  const type = signalement?.type || null
  const label = typeof type === 'string'
    ? type
    : (type?.libelle || type?.label || type?.name || '').toString()
  const typeId = normalizeTypeId(type?.id || type?.typeId || signalement?.typeId || signalement?.type_id || signalement?.type || fallbackTypeId)

  const labelMap = {
    'Problème critique': '⚠️',
    'Travaux en cours': '🚗',
    'Problème résolu': '✓',
    'Alerte signalée': '⚠️',
    'Infrastructure endommagée': '🔧',
    "Problème d'inondation": '💧',
    'Chaussée dégradée': '🏁',
  }

  const idMap = {
    1: '⚠️',
    2: '🚗',
    3: '✓',
    4: '⚠️',
    5: '🔧',
    6: '💧',
    7: '🏁',
  }

  if (label && labelMap[label]) {
    return labelMap[label]
  }
  if (typeId && idMap[typeId]) {
    return idMap[typeId]
  }

  return getIconSymbol(type?.icon_symbol || type?.iconSymbol) || '⚠️'
}

const getIconColor = (iconColor) => {
  if (!iconColor) return '#6c757d'
  if (typeof iconColor === 'string' && iconColor.startsWith('#')) {
    return iconColor
  }
  const colors = {
    'red': '#dc3545',
    'purple': '#6f42c1',
    'green': '#28a745',
    'yellow': '#ffc107',
    'orange': '#fd7e14',
    'blue': '#007bff',
    'red-white': '#dc3545',
  }
  return colors[iconColor] || '#6c757d'
}

const getTypeColorById = (typeId) => {
  const colorsById = {
    1: '#dc3545',
    2: '#6f42c1',
    3: '#28a745',
    4: '#ffc107',
    5: '#fd7e14',
    6: '#007bff',
    7: '#dc3545',
    8: '#666666',
    9: '#DD0000',
    10: '#999999',
  }
  return colorsById[typeId] || '#6c757d'
}

const createMarkerIconStyle = (signalement) => {
  const type = signalement?.type || null
  const typeId = normalizeTypeId(type?.id || type?.typeId || signalement?.typeId || signalement?.type_id || signalement?.type)

  if (!type && !typeId) {
    return {
      html: `<div style="
        width: 40px;
        height: 40px;
        background-color: #6c757d;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        font-size: 18px;
      ">⚠️</div>`,
      className: "custom-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    }
  }

  const color = getIconColor(type?.icon_color || type?.iconColor) || getTypeColorById(typeId)
  const symbol = getTypeEmoji(signalement, typeId)

  const isCheckered = (type?.icon_symbol || type?.iconSymbol) === 'checkered'
  const backgroundStyle = isCheckered
    ? `background: repeating-linear-gradient(
        45deg,
        ${color},
        ${color} 5px,
        white 5px,
        white 10px
      );`
    : `background-color: ${color};`

  return {
    html: `<div style="
      width: 40px;
      height: 40px;
      ${backgroundStyle}
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 6px rgba(0,0,0,0.4);
      font-size: 18px;
    ">${symbol}</div>`,
    className: "custom-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  }
}

const getTypeLabel = (signalement) => {
  const type = signalement?.type
  if (type?.libelle) return type.libelle
  const rawTypeId = signalement?.typeId || signalement?.type?.id
  if (!rawTypeId) return '—'
  return `Type #${rawTypeId}`
}

const getStatusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'nouveau':
      return '#48bb78'
    case 'en_cours':
      return '#ed8936'
    case 'termine':
    case 'terminé':
      return '#3182ce'
    default:
      return '#718096'
  }
}

const getStatusLabel = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'nouveau':
      return 'Nouveau'
    case 'en_cours':
      return 'En cours'
    case 'termine':
    case 'terminé':
      return 'Terminé'
    case 'en_attente':
      return 'En attente'
    default:
      return status || 'Inconnu'
  }
}

const formatDate = (dateValue) => {
  if (!dateValue) return 'Date inconnue'
  let date

  if (typeof dateValue === 'object') {
    const seconds = dateValue?.seconds ?? dateValue?._seconds
    const nanos = dateValue?.nanoseconds ?? dateValue?._nanoseconds ?? 0
    if (typeof seconds === 'number') {
      date = new Date(seconds * 1000 + Math.floor(nanos / 1e6))
    } else if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate()
    } else {
      date = new Date(String(dateValue))
    }
  } else {
    date = new Date(dateValue)
  }
  if (Number.isNaN(date.getTime())) return 'Date inconnue'
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getStatusCount = (status) => {
  const statusMap = {
    'nouveau': (s) => (s.status || '').toLowerCase() === 'nouveau',
    'en_cours': (s) => (s.status || '').toLowerCase() === 'en_cours',
    'termine': (s) => (s.status || '').toLowerCase() === 'termine' || (s.status || '').toLowerCase() === 'terminé'
  }

  if (!statusMap[status]) return 0
  return signalements.value.filter(statusMap[status]).length
}

// Initialisation de la carte
const initializeMap = async () => {
  if (!mapContainer.value) return

  try {
    // Config icônes Leaflet
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    // Création de la carte
    map = L.map(mapContainer.value, {
      center: [-18.8792, 47.5079], // Antananarivo
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: false,
      updateWhenIdle: true,
      preferCanvas: true,
      fadeAnimation: false,
      zoomAnimation: true,
    })

    // TileLayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      maxNativeZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
      subdomains: ['a', 'b', 'c'],
      errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      keepBuffer: 2,
      updateInterval: 200,
      updateWhenIdle: true,
      updateWhenZooming: true,
      reuseTiles: true,
      noWrap: true,
      crossOrigin: 'anonymous'
    }).addTo(map)

    // Cluster de marqueurs
    try {
      markerClusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        removeOutsideVisibleBounds: true,
        animate: false,
        maxClusterRadius: 60,
        disableClusteringAtZoom: 17,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount()
          let size = 'small'
          let radius = 25
          if (count > 20) {
            size = 'large'
            radius = 35
          } else if (count > 10) {
            size = 'medium'
            radius = 30
          }
          return L.divIcon({
            html: `<div class="cluster cluster-${size}"><span>${count}</span></div>`,
            className: 'cluster-icon',
            iconSize: [radius * 2, radius * 2],
            iconAnchor: [radius, radius]
          })
        }
      })
      map.addLayer(markerClusterGroup)
    } catch (clusterError) {
      console.error('Erreur cluster:', clusterError)
      markerClusterGroup = null
    }

    // Charger les signalements
    await loadSignalements()
  } catch (error) {
    console.error('Erreur initialisation carte:', error)
    await showToast('Erreur lors de l\'initialisation de la carte', 'danger')
  } finally {
    isLoading.value = false
  }
}

// Charger les signalements
const loadSignalements = async () => {
  try {
    const reportsStore = useReportsStore()
    await reportsStore.fetchReports()
    signalements.value = reportsStore.reports
    updateMarkers()
  } catch (error) {
    console.error('Erreur chargement signalements:', error)
    await showToast('Erreur lors du chargement des signalements', 'danger')
  }
}

// Mettre à jour les marqueurs
const updateMarkers = () => {
  if (!map) return

  try {
    if (markerClusterGroup) {
      markerClusterGroup.clearLayers()
      
      let markerCount = 0
      signalements.value.forEach(signalement => {
        const marker = createMarker(signalement)
        if (marker) {
          markerClusterGroup.addLayer(marker)
          markerCount++
        }
      })
    } else {
      if (markersLayer) {
        map.removeLayer(markersLayer)
      }
      
      markersLayer = L.featureGroup()
      signalements.value.forEach(signalement => {
        const marker = createMarker(signalement)
        if (marker) {
          markersLayer.addLayer(marker)
        }
      })
      
      if (markersLayer.getLayers().length > 0) {
        map.addLayer(markersLayer)
      }
    }
  } catch (error) {
    console.error('Erreur mise à jour marqueurs:', error)
  }
}

// Créer un marqueur
const createMarker = (signalement) => {
  try {
    if (!signalement.latitude || !signalement.longitude) return null

    const iconConfig = createMarkerIconStyle(signalement)
    const icon = L.divIcon(iconConfig)
    const marker = L.marker([signalement.latitude, signalement.longitude], { icon })

    const popupContent = `
      <div class="marker-popup">
        <h4>${signalement.description || 'Sans description'}</h4>
        <p class="address">📍 ${signalement.address || 'Position'}</p>
        <div class="status">
          <span class="badge" style="background-color: ${getStatusColor(signalement.status)}">
            ${getStatusLabel(signalement.status)}
          </span>
        </div>
        <p class="type"><strong>Type:</strong> ${getTypeEmoji(signalement)} ${getTypeLabel(signalement)}</p>
        <p class="date"><strong>Date:</strong> ${formatDate(signalement.dateCreation || signalement.createdAt)}</p>
      </div>
    `

    marker.bindPopup(popupContent)
    return marker
  } catch (error) {
    console.error('Erreur création marqueur:', error)
    return null
  }
}

const zoomIn = () => {
  if (map) map.zoomIn()
}

const zoomOut = () => {
  if (map) map.zoomOut()
}

const refreshData = async () => {
  await loadSignalements()
  await showToast('Données actualisées', 'success')
}

const showToast = async (message, color = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'top'
  })
  await toast.present()
}

// Cycle de vie
onMounted(async () => {
  await initializeMap()
  if (map) {
    setTimeout(() => map.invalidateSize(), 200)
  }
})

watch(currentView, (view) => {
  if (view === 'map' && map) {
    setTimeout(() => map.invalidateSize(), 200)
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
/* 🎨 Dark Theme - Noir & Jaune */
:root {
  --map-height: calc(100vh - 56px - 56px);
  --button-border-radius: 50%;
}

.visitor-toolbar {
  --background: #2a2a2a;
  --border-bottom: 1px solid rgba(255, 193, 7, 0.2);
}

.app-logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--ion-color-primary);
  letter-spacing: 0.5px;
}

.title-sep {
  margin: 0 8px;
  color: rgba(255, 193, 7, 0.5);
  font-weight: 300;
}

.app-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.back-button,
.login-header-button {
  color: var(--ion-color-primary);
}

.filter-button {
  --color: var(--ion-color-primary);
}

.visitor-map-content {
  position: relative;
  height: calc(100vh - 56px - 56px);
  width: 100%;
  --background: var(--app-background);
  --padding: 0;
  --margin: 0;
  display: flex;
  flex-direction: column;
}

.map-section {
  flex: 1;
  position: relative;
  min-height: 100%;
}

.map-container {
  height: 100%;
  width: 100%;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #2a2a2a;
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-button {
  --background: #ffc107;
  --color: var(--app-text-primary);
  --border-radius: 50%;
  width: 44px;
  height: 44px;
  --padding-start: 0;
  --padding-end: 0;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.4);
}

.refresh-button-container {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 1000;
}

.refresh-button {
  --background: #ffc107;
  --color: var(--app-text-primary);
  --border-radius: 50%;
  width: 44px;
  height: 44px;
  --padding-start: 0;
  --padding-end: 0;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.4);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 26, 26, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-overlay p {
  margin-top: 12px;
  color: var(--ion-color-primary);
  font-size: 14px;
}

/* Styles pour les marqueurs et popups */
:deep(.custom-marker) {
  background: none;
  border: none;
}

:deep(.marker-content) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--app-surface);
  border: 2px solid var(--ion-color-primary);
  color: var(--ion-color-primary);
  font-size: 16px;
  box-shadow: 0 6px 16px rgba(var(--ion-color-primary-rgb), 0.35);
  transform: translateZ(0);
}

:deep(.cluster-icon) {
  background: none;
  border: none;
}

:deep(.cluster) {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--app-surface);
  border: 2px solid var(--ion-color-primary);
  color: var(--ion-color-primary);
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(var(--ion-color-primary-rgb), 0.35);
}

:deep(.cluster-small) {
  font-size: 12px;
}

:deep(.cluster-medium) {
  font-size: 13px;
}

:deep(.cluster-large) {
  font-size: 14px;
}

:deep(.leaflet-popup-content-wrapper) {
  background: #1f1f1f;
  color: var(--ion-text-color);
  border-radius: 14px;
  border: 1px solid rgba(255, 193, 7, 0.25);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
}

:deep(.leaflet-popup-tip) {
  background: #1f1f1f;
  border: 1px solid rgba(255, 193, 7, 0.25);
}

:deep(.leaflet-popup-content) {
  margin: 10px 12px;
}

:deep(.marker-popup) {
  min-width: 220px;
  font-family: var(--ion-font-family);
  border-radius: 12px;
  overflow: hidden;
  background: #2a2a2a;
  padding: 10px 12px 12px;
  border: 1px solid rgba(255, 193, 7, 0.2);
}

:deep(.marker-popup h4) {
  margin: 0 0 8px 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--ion-color-primary);
}

:deep(.marker-popup .address) {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #b3b3b3;
  line-height: 1.5;
}

:deep(.marker-popup p) {
  margin: 4px 0;
  font-size: 12px;
  color: #b3b3b3;
}

:deep(.marker-popup .type),
:deep(.marker-popup .surface),
:deep(.marker-popup .budget) {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #b3b3b3;
}

:deep(.marker-popup .type strong),
:deep(.marker-popup .surface strong),
:deep(.marker-popup .budget strong) {
  color: var(--ion-color-primary);
  font-weight: 600;
}

:deep(.marker-popup .badge) {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--ion-color-primary-contrast);
  font-size: 11px;
  font-weight: 600;
}

/* Responsive pour la carte et les marqueurs */
@media (max-width: 480px) {
  .map-controls {
    top: 14px;
    right: 14px;
    gap: 10px;
  }

  .control-button {
    width: 48px;
    height: 48px;
    box-shadow: 0 2px 10px rgba(255, 193, 7, 0.4);
  }
}

/* Navigation bar en bas */
.visitor-nav-footer {
  --background: transparent;
  --padding: 0;
  --margin: 0;
}

.visitor-nav-bar {
  --background: #2a2a2a;
  --border-top: 1px solid rgba(255, 193, 7, 0.2);
  --padding-start: 0;
  --padding-end: 0;
  display: flex;
  flex-direction: column;
}

.nav-buttons {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: 60px;
}

.nav-btn {
  flex: 1;
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  cursor: pointer;
  border: none;
  padding: 0;
  position: relative;
  min-width: 50px;
}

.nav-icon {
  font-size: 28px !important;
  color: rgba(255, 255, 255, 0.7) !important;
  line-height: 1;
  transition: all 0.3s ease;
}

.nav-btn.active .nav-icon {
  color: #ffc107 !important;
  filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.6));
  transform: scale(1.1);
}

.nav-btn.login-btn .nav-icon {
  color: #ff6b6b !important;
}

.nav-link {
  text-decoration: none;
  color: inherit;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Table section */
.table-section {
  padding-bottom: 60px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 193, 7, 0.2);
  background: #333;
  position: sticky;
  top: 0;
  z-index: 100;
}

.table-header h3 {
  margin: 0;
  color: var(--ion-color-primary);
  font-size: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
  text-align: center;
}

.empty-state ion-icon {
  margin-bottom: 10px;
}

.signalements-list {
  --background: transparent;
}

.signalement-item {
  --background: rgba(255, 193, 7, 0.05);
  --border-bottom: 1px solid rgba(255, 193, 7, 0.1);
  --padding-start: 12px;
  --padding-end: 12px;
  --inner-padding-end: 0;
}

.item-content {
  width: 100%;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-emoji {
  font-size: 22px;
  line-height: 1;
}

.type-label {
  color: var(--ion-color-primary);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.3px;
}

.item-status {
  padding: 4px 8px;
  border-radius: 8px;
  color: var(--ion-text-color);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  margin: 4px 0;
}

.item-date {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin: 4px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-date ion-icon {
  font-size: 12px;
}

/* Stats section */
.stats-section {
  padding-bottom: 60px;
}

.stats-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 193, 7, 0.2);
  background: #333;
  position: sticky;
  top: 0;
  z-index: 100;
}

.stats-header h3 {
  margin: 0;
  color: var(--ion-color-primary);
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
}

.stat-card {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: var(--ion-text-color);
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}

.stat-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.legend-section {
  padding: 16px;
  border-top: 1px solid rgba(255, 193, 7, 0.2);
}

.legend-section h4 {
  color: var(--ion-color-primary);
  font-size: 14px;
  margin: 0 0 12px 0;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(255, 193, 7, 0.05);
  border-radius: 8px;
}

.legend-emoji {
  font-size: 26px;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.legend-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

</style>
