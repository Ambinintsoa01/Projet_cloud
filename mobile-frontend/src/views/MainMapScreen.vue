<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="app-logo">ROAD ALERT</span>
          <span class="title-sep">•</span>
          <span class="app-title">Carte des Signalements</span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleFilters" class="filter-button">
            <ion-icon name="filter" :color="showFilters ? 'primary' : 'medium'"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Filtres (masquables) -->
      <ion-toolbar v-if="showFilters" class="filters-toolbar">
        <ion-segment
          v-model="selectedFilter"
          @ion-change="onFilterChange"
          scrollable
          class="filters-segment"
        >
          <ion-segment-button value="all">
            <ion-label>Tous</ion-label>
          </ion-segment-button>
          <ion-segment-button value="new">
            <ion-label>Nouveaux</ion-label>
          </ion-segment-button>
          <ion-segment-button value="in_progress">
            <ion-label>En cours</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Terminés</ion-label>
          </ion-segment-button>
          <ion-segment-button value="mine">
            <ion-label>Mes signalements</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="map-content">
      <!-- Conteneur de la carte -->
      <div ref="mapContainer" class="map-container"></div>

      <!-- Contrôles de zoom personnalisés -->
      <div class="map-controls">
        <ion-button
          fill="solid"
          shape="round"
          @click="zoomIn"
          class="control-button"
        >
          <ion-icon name="add"></ion-icon>
        </ion-button>
        <ion-button
          fill="solid"
          shape="round"
          @click="zoomOut"
          class="control-button"
        >
          <ion-icon name="remove"></ion-icon>
        </ion-button>
      </div>

      <!-- Boutons de signalement visibles -->
      <div class="simple-buttons">
        <button 
          @click="$router.push('/report/new')" 
          class="simple-btn orange-btn"
        >
          📝 Formulaire
        </button>
        <button 
          @click="$router.push('/report/map')" 
          class="simple-btn blue-btn"
        >
          📍 Sur la carte
        </button>
      </div>

      <!-- Anciens boutons FAB (cachés) -->
      <div class="fab-container" style="display: none;">
        <!-- Bouton "Nouveau signalement" -->
        <ion-fab
          vertical="top"
          horizontal="start"
          slot="fixed"
          class="report-fab"
        >
          <ion-fab-button router-link="/report/new" color="secondary">
            <ion-icon name="add"></ion-icon>
          </ion-fab-button>
          <ion-label>Formulaire</ion-label>
        </ion-fab>

        <!-- Bouton "Signaler sur la carte" -->
        <ion-fab
          vertical="top"
          horizontal="start"
          slot="fixed"
          class="map-report-fab"
        >
          <ion-fab-button router-link="/report/map" color="primary">
            <ion-icon name="location"></ion-icon>
          </ion-fab-button>
          <ion-label>Sur la carte</ion-label>
        </ion-fab>
      </div>

      <!-- Indicateur de chargement -->
      <div v-if="isLoading" class="loading-overlay">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Chargement de la carte...</p>
      </div>

      <!-- Indicateur de statut réseau -->
      <div class="status-indicator" :class="{ offline: !isOnline }">
        <ion-icon :name="isOnline ? 'wifi' : 'cloud-offline'"></ion-icon>
      </div>
    </ion-content>

    <!-- Modal de détails du signalement -->
    <ion-modal
      :is-open="showReportModal"
      @did-dismiss="closeReportModal"
      class="report-modal"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>
            <span class="app-logo">ROAD ALERT</span>
            <span class="title-sep">•</span>
            <span class="app-title">Détails du signalement</span>
          </ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeReportModal">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content v-if="selectedReport">
        <div class="report-details">
          <!-- En-tête -->
          <div class="report-header">
            <div class="report-title-section">
              <h2>{{ selectedReport.description || selectedReport.title || 'Sans description' }}</h2>
              <ion-badge :color="getStatusColor(selectedReport.status)">
                {{ getStatusLabel(selectedReport.status) }}
              </ion-badge>
            </div>
            <div class="report-meta">
              <p class="report-address">
                <ion-icon name="location"></ion-icon>
                {{ selectedReport.address || 'Position: ' + selectedReport.latitude + ', ' + selectedReport.longitude }}
              </p>
              <p class="report-date">
                <ion-icon name="calendar"></ion-icon>
                {{ formatDate(selectedReport.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Catégorie -->
          <div v-if="selectedReport.category" class="report-category">
            <ion-chip color="primary">
              <ion-icon :name="getCategoryIcon(selectedReport.category)"></ion-icon>
              <ion-label>{{ getCategoryLabel(selectedReport.category) }}</ion-label>
            </ion-chip>
          </div>

          <!-- Description -->
          <div v-if="selectedReport.description" class="report-description">
            <h3>Description</h3>
            <p>{{ selectedReport.description }}</p>
          </div>

          <!-- Type, Surface, Budget -->
          <div class="report-details-grid">
            <div v-if="selectedReport.type" class="detail-item">
              <h4>Type</h4>
              <p>{{ getTypeLabel(selectedReport) }}</p>
            </div>
          </div>

          <!-- Photos -->
          <div v-if="selectedReport.photos && selectedReport.photos.length > 0" class="report-photos">
            <h3>Photos</h3>
            <div class="photo-carousel">
              <div class="photo-container">
                <img :src="selectedReport.photos[0]" :alt="'Photo principale'" class="report-photo" />
                <div v-if="selectedReport.photos.length > 1" class="photo-counter">
                  +{{ selectedReport.photos.length - 1 }}
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="report-actions">
            <ion-button
              expand="block"
              fill="outline"
              @click="shareReport"
              class="action-button"
            >
              <ion-icon name="share" slot="start"></ion-icon>
              Partager
            </ion-button>
            <ion-button
              expand="block"
              @click="getDirections"
              class="action-button"
            >
              <ion-icon name="navigate" slot="start"></ion-icon>
              Itinéraire
            </ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>
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
  IonFab,
  IonFabButton,
  IonSpinner,
  IonModal,
  IonBadge,
  IonChip,
  alertController,
  toastController
} from '@ionic/vue'
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import L from 'leaflet'
import 'leaflet.markercluster'
import { useMapStore } from '@/stores/map.store'
import { useReportsStore } from '@/stores/reports.store'
import { useGeolocation } from '@/composables/useGeolocation'
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS, REPORT_CATEGORY_ICONS, REPORT_CATEGORY_LABELS } from '@/utils/constants'

// État réactif
const mapStore = useMapStore()
const reportsStore = useReportsStore()
const { getCurrentPosition, hasUserLocation } = useGeolocation()

const mapContainer = ref(null)
let map = null
let markersLayer = null
let userLocationMarker = null
let markerClusterGroup = null

const showFilters = ref(false)
const selectedFilter = ref('all')
const showReportModal = ref(false)
const selectedReport = ref(null)
const isLoading = ref(true)
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)


// Getters calculés
const filteredReports = computed(() => {
  return reportsStore.filteredReports
})

// Méthodes
const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const onFilterChange = (event) => {
  const filter = event.detail.value
  reportsStore.setFilters({ status: filter })
}

const initializeMap = async () => {
  if (!mapContainer.value) return

  try {
    // Vérifier la connexion
    if (!isOnline.value) {
      await showToast('La carte requiert une connexion internet active', 'warning')
      isLoading.value = false
      return
    }

    // Vérifier que le conteneur est bien visible et dimensionné
    const containerRect = mapContainer.value.getBoundingClientRect()
    if (containerRect.width === 0 || containerRect.height === 0) {
      console.warn('⚠️ Conteneur de carte non dimensionné, attente...')
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Config icônes Leaflet - Utiliser une version locale simplifiée
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    // Création de la carte avec optimisations de performance
    map = L.map(mapContainer.value, {
      center: mapStore.center,
      zoom: mapStore.zoom,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: false,      // Désactiver pour mobile
      updateWhenIdle: true,        // Réduit les updates pendant le panning
      preferCanvas: true,           // Utilise Canvas au lieu de SVG pour meilleure perf
      fadeAnimation: false,         // Désactive animations pour plus de vitesse
      zoomAnimation: true,          // Garde animation zoom seulement
    })

    console.log('✅ Carte Leaflet initialisée avec succès')

    // TileLayer ONLINE uniquement - OpenStreetMap optimisé
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      maxNativeZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
      errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      keepBuffer: 2,
      updateInterval: 200,
      noWrap: true,
      crossOrigin: 'anonymous'     // Important pour éviter les erreurs CORS
    }).addTo(map)

    console.log('✅ Tuiles OpenStreetMap chargées')

    // Cluster de marqueurs optimisé
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
      console.log('✅ Groupe de clusters créé et ajouté')
    } catch (clusterError) {
      console.error('⚠️ Erreur cluster, utilisation de marqueurs simples:', clusterError)
      // Fallback sans clustering
      markerClusterGroup = null
    }

    // Sauvegarder l'instance
    mapStore.setMapInstance(map)

    // Charger les signalements
    await loadReports()

    // Position utilisateur avec gestion d'erreur
    try {
      await getCurrentPosition()
      console.log('✅ Position utilisateur obtenue')
    } catch (geoError) {
      console.warn('⚠️ Erreur géolocalisation:', geoError)
      // Continuer même sans géolocalisation
    }

    // Watchers / Events
    map.on('moveend', updateMapState)
    map.on('zoomend', updateMapState)

    console.log('✅ Tous les événements de carte enregistrés')

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE lors de l\'initialisation de la carte:', error)
    console.error('Stack:', error.stack)
    await showToast(`Erreur carte: ${error.message || 'Erreur inconnue'}`, 'danger')
  } finally {
    isLoading.value = false
  }
}


const updateMapState = () => {
  if (!map) return

  const center = map.getCenter()
  const zoom = map.getZoom()

  mapStore.setCenter([center.lat, center.lng])
  mapStore.setZoom(zoom)
}

const loadReports = async () => {
  try {
    console.log('📡 Chargement des signalements...')
    console.log('📊 Avant fetch - reports:', reportsStore.reports.length)
    
    await reportsStore.fetchReports()
    
    console.log('📊 Après fetch - reports.value:', reportsStore.reports.length)
    console.log('📊 Après fetch - filteredReports:', filteredReports.value.length)
    console.log('📄 Détails des signalements:', JSON.stringify(reportsStore.reports.map(r => ({
      id: r.id,
      lat: r.latitude,
      lng: r.longitude,
      desc: r.description?.substring(0, 20)
    }))))
    
    if (reportsStore.reports.length === 0) {
      console.warn('⚠️ Aucun signalement disponible')
    }
    
    updateMarkers()
  } catch (error) {
    console.error('❌ Erreur lors du chargement des signalements:', error)
    await showToast('Erreur lors du chargement des signalements', 'danger')
  }
}

const updateMarkers = () => {
  if (!map) {
    console.warn('⚠️ updateMarkers: Carte non initialisée')
    return
  }

  try {
    // Si on a un cluster group
    if (markerClusterGroup) {
      markerClusterGroup.clearLayers()
      
      // Créer les nouveaux marqueurs
      let markerCount = 0
      filteredReports.value.forEach(report => {
        const marker = createReportMarker(report)
        if (marker) {
          markerClusterGroup.addLayer(marker)
          markerCount++
        }
      })
      
      console.log(`✅ ${markerCount} marqueurs ajoutés au cluster`)
    } else {
      // Fallback sans clustering - créer une layer directe
      if (markersLayer) {
        map.removeLayer(markersLayer)
      }
      
      markersLayer = L.featureGroup()
      filteredReports.value.forEach(report => {
        const marker = createReportMarker(report)
        if (marker) {
          markersLayer.addLayer(marker)
        }
      })
      
      if (markersLayer.getLayers().length > 0) {
        map.addLayer(markersLayer)
        console.log(`✅ ${markersLayer.getLayers().length} marqueurs ajoutés (sans clustering)`)
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des marqueurs:', error)
  }
}

const createReportMarker = (report) => {
  try {
    // Validation des données
    if (!report.latitude || !report.longitude) {
      console.warn(`⚠️ Marqueur sans coordonnées valides:`, report)
      return null
    }

    // Créer l'icône personnalisée selon le type
    const iconConfig = createMarkerIconStyle(report)
    const icon = L.divIcon(iconConfig)

    // Créer le marqueur
    const marker = L.marker([report.latitude, report.longitude], { icon })

    // Popup avec informations de base
    const popupContent = `
      <div class="marker-popup">
        <h4>${report.description || report.title || 'Sans description'}</h4>
        <p class="address">📍 ${report.address || 'Position: ' + report.latitude.toFixed(4) + ', ' + report.longitude.toFixed(4)}</p>
        <div class="status">
          <span class="badge" style="background-color: ${REPORT_STATUS_COLORS[report.status] || '#999'}">
            ${REPORT_STATUS_LABELS[report.status] || report.status}
          </span>
        </div>
        <p class="type"><strong>Type:</strong> ${getTypeEmoji(report)} ${getTypeLabel(report)}</p>
        <button class="details-btn" onclick="window.showReportDetails('${report.id}')">
          Voir détails
        </button>
      </div>
    `

    marker.bindPopup(popupContent)

    // Gestionnaire de clic
    marker.on('click', () => {
      showReportDetails(report.id)
    })

    return marker
  } catch (error) {
    console.error(`❌ Erreur création marqueur pour ${report?.title}:`, error)
    return null
  }
}

const getIconSymbol = (iconSymbol) => {
  if (!iconSymbol) return null;
  const symbols = {
    '!': '⚠️',
    'car': '🚗',
    'check': '✓',
    'wrench': '🔧',
    'water': '💧',
    'checkered': '🏁',
  };
  return symbols[iconSymbol] || iconSymbol;
};

const normalizeTypeId = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// Correspondance entre le libellé du type et l'emoji demandé
const getTypeEmoji = (report, fallbackTypeId = null) => {
  const type = report?.type || null
  const label = typeof type === 'string'
    ? type
    : (type?.libelle || type?.label || report?.category || report?.typeLabel || report?.type?.libelle || '').toString();
  const typeId = normalizeTypeId(type?.id || type?.typeId || report?.typeId || report?.type_id || report?.type || fallbackTypeId);

  const labelMap = {
    'Problème critique': '⚠️',
    'Travaux en cours': '🚗',
    'Problème résolu': '✓',
    'Alerte signalée': '⚠️',
    'Infrastructure endommagée': '🔧',
    "Problème d'inondation": '💧',
    'Chaussée dégradée': '🏁',
  };

  const idMap = {
    1: '⚠️',
    2: '🚗',
    3: '✓',
    4: '⚠️',
    5: '🔧',
    6: '💧',
    7: '🏁',
  };

  if (label && labelMap[label]) {
    return labelMap[label];
  }
  if (typeId && idMap[typeId]) {
    return idMap[typeId];
  }

  return getIconSymbol(type?.icon_symbol || type?.iconSymbol) || '⚠️';
};

// Correspondance entre les couleurs de la BD et les codes couleur
const getIconColor = (iconColor) => {
  if (!iconColor) return '#6c757d';
  if (typeof iconColor === 'string' && iconColor.startsWith('#')) {
    return iconColor;
  }
  const colors = {
    'red': '#dc3545',
    'purple': '#6f42c1',
    'green': '#28a745',
    'yellow': '#ffc107',
    'orange': '#fd7e14',
    'blue': '#007bff',
    'red-white': '#dc3545',
  };
  return colors[iconColor] || '#6c757d';
};

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
  };
  return colorsById[typeId] || '#6c757d';
};

// Créer des icônes personnalisées pour chaque type
const createMarkerIconStyle = (report) => {
  const type = report?.type || null;
  const typeId = normalizeTypeId(type?.id || type?.typeId || report?.typeId || report?.type_id || report?.type);

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
    };
  }

  const color = getIconColor(type?.icon_color || type?.iconColor) || getTypeColorById(typeId);
  const symbol = getTypeEmoji(report, typeId);
  
  // Style spécial pour le motif damier (checkered)
  const isCheckered = (type?.icon_symbol || type?.iconSymbol) === 'checkered';
  const backgroundStyle = isCheckered
    ? `background: repeating-linear-gradient(
        45deg,
        ${color},
        ${color} 5px,
        white 5px,
        white 10px
      );`
    : `background-color: ${color};`;
  
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
  };
};

const getTypeLabel = (report) => {
  const type = report?.type;
  if (type?.libelle) return type.libelle;
  const rawTypeId = report?.typeId || report?.type?.id;
  if (!rawTypeId) return '—';
  return `Type #${rawTypeId}`;
}

const getStatusEmoji = (status) => {
  const emojis = {
    new: '🔴',
    in_progress: '🟡',
    completed: '🟢'
  }
  return emojis[status] || '📍'
}

const getStatusColor = (status) => {
  const colors = {
    new: 'danger',
    in_progress: 'warning',
    completed: 'success'
  }
  return colors[status] || 'primary'
}

const getStatusLabel = (status) => {
  return REPORT_STATUS_LABELS[status] || status
}

const getCategoryIcon = (category) => {
  return REPORT_CATEGORY_ICONS[category] || 'help-circle'
}

const getCategoryLabel = (category) => {
  return REPORT_CATEGORY_LABELS[category] || category
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Fonction globale pour les popups (car Leaflet ne peut pas accéder directement aux méthodes Vue)
window.showReportDetails = (reportId) => {
  const report = reportsStore.reports.find(r => r.id === reportId)
  if (report) {
    selectedReport.value = report
    showReportModal.value = true
  }
}

const showReportDetails = (reportId) => {
  window.showReportDetails(reportId)
}

const closeReportModal = () => {
  showReportModal.value = false
  selectedReport.value = null
}

const centerOnUserLocation = async () => {
  try {
    if (!hasUserLocation.value) {
      await getCurrentPosition()
    }
    mapStore.centerOnUser()
  } catch (error) {
    console.error('Erreur lors du centrage sur la position:', error)
    await showToast('Impossible de localiser votre position', 'warning')
  }
}

const zoomIn = () => {
  if (map) {
    map.zoomIn()
  }
}

const zoomOut = () => {
  if (map) {
    map.zoomOut()
  }
}

const shareReport = async () => {
  if (!selectedReport.value) return

  const report = selectedReport.value
  const shareData = {
    title: `Signalement: ${report.title}`,
    text: `${report.description}\n\nAdresse: ${report.address}`,
    url: window.location.origin
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      // Fallback: copier dans le presse-papiers
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`)
      await showToast('Informations copiées dans le presse-papiers', 'success')
    }
  } catch (error) {
    console.error('Erreur lors du partage:', error)
    await showToast('Erreur lors du partage', 'danger')
  }
}

const getDirections = () => {
  if (!selectedReport.value) return

  const report = selectedReport.value
  const url = `https://www.openstreetmap.org/directions?from=&to=${report.latitude},${report.longitude}`

  window.open(url, '_blank')
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

// Watchers
watch(filteredReports, updateMarkers)

// Cycle de vie
onMounted(async () => {
  console.log('📱 MainMapScreen montée')
  
  // Configurer les listeners de connexion
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    window.addEventListener('online', () => {
      isOnline.value = true
      console.log('🟢 En ligne')
    })
    window.addEventListener('offline', () => {
      isOnline.value = false
      console.log('🔴 Hors ligne')
    })
  }
  
  // Vérifier l'état initial
  console.log('🔍 État réseau initial:', isOnline.value)
  console.log('🔍 Conteneur de carte:', mapContainer.value)
  
  try {
    await initializeMap()
    console.log('✅ MainMapScreen prête')
  } catch (error) {
    console.error('❌ Erreur fatale au montage:', error)
    await showToast('Erreur d\'initialisation de la carte', 'danger')
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

.map-content {
  position: relative;
  height: calc(100vh - 56px - 56px);
  width: 100%;
  --padding: 0;
  --margin: 0;
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
  background: var(--app-background);
}

.filters-toolbar {
  --background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);
}

.filters-segment {
  --background: transparent;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.location-fab,
.report-fab {
  margin-bottom: 80px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
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

.status-indicator {
  position: absolute;
  top: 16px;
  left: 16px;
  background: var(--app-surface);
  border: 2px solid var(--ion-color-primary);
  border-radius: 20px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--app-text-primary);
}

.status-indicator.offline {
  border-color: var(--app-text-primary);
  color: var(--app-text-primary);
}

.status-indicator ion-icon {
  font-size: 16px;
}

/* Modal styles */
.report-modal {
  --width: 90vw;
  --height: 80vh;
  --border-radius: 12px;
  --background: var(--app-background);
}

.report-details {
  padding: 20px;
  background: var(--app-background);
}

.report-header {
  margin-bottom: 20px;
}

.report-title-section h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--ion-color-primary);
}

.report-meta p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--app-text-secondary);
}

.report-description h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--ion-color-primary);
}

.report-description p {
  line-height: 1.5;
  color: var(--app-text-secondary);
}

.report-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: var(--app-surface);
  border-radius: 8px;
}

.report-details-grid .detail-item {
  padding: 8px;
  background: var(--app-surface);
  border-radius: 6px;
  border-left: 4px solid var(--ion-color-primary);
}

.report-details-grid .detail-item h4 {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-secondary);
  margin: 0 0 6px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.report-details-grid .detail-item p {
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-color-primary);
  margin: 0;
}

.report-photos h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--ion-color-primary);
}

.photo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
}

.photo-counter {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--ion-color-primary);
  color: var(--app-text-primary);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.report-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-button {
  --background: #ffc107;
  --color: var(--app-text-primary);
  --border-radius: var(--button-border-radius);
}

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
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  transform: translateZ(0);
}

:deep(.marker-new .marker-content) {
  background: var(--ion-color-primary);
  border-color: var(--app-text-primary);
  color: var(--app-text-primary);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

:deep(.marker-in_progress .marker-content) {
  background-color: var(--ion-color-primary);
  border-color: var(--ion-text-color);
  color: var(--app-text-primary);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

:deep(.marker-completed .marker-content) {
  background: var(--app-text-primary);
  border-color: var(--ion-color-primary);
  color: var(--ion-color-primary);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
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

/* Boutons simples visibles */
.simple-buttons {
  position: fixed;
  top: 80px;
  left: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.simple-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-width: 140px;
}

.simple-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.orange-btn {
  background: #ff9800;
  color: white;
}

.blue-btn {
  background: #2196f3;
  color: white;
}

/* Boutons flottants */
.fab-container {
  position: fixed;
  top: 80px;
  left: 20px;
  z-index: 1000;
}

.report-fab {
  position: absolute;
  top: 0px;
}

.map-report-fab {
  position: absolute;
  top: 80px;
}

.report-fab ion-fab-button,
.map-report-fab ion-fab-button {
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.report-fab ion-label,
.map-report-fab ion-label {
  position: absolute;
  right: 70px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.report-fab:hover ion-label,
.map-report-fab:hover ion-label {
  opacity: 1;
}

:deep(.cluster-large) {
  font-size: 14px;
}

:deep(.leaflet-popup-content-wrapper) {
  background: var(--app-surface);
  color: var(--ion-text-color);
  border-radius: 14px;
  border: 1px solid var(--app-border);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
}

:deep(.leaflet-popup-tip) {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
}

:deep(.leaflet-popup-content) {
  margin: 10px 12px;
}

:deep(.marker-popup) {
  min-width: 220px;
  font-family: var(--ion-font-family);
  border-radius: 12px;
  overflow: hidden;
  background: var(--app-surface);
  padding: 10px 12px 12px;
  border: 1px solid var(--app-border);
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
  color: var(--app-text-secondary);
  line-height: 1.5;
}

:deep(.marker-popup .type),
:deep(.marker-popup .surface),
:deep(.marker-popup .budget) {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--app-text-secondary);
}

:deep(.marker-popup .type strong),
:deep(.marker-popup .surface strong),
:deep(.marker-popup .budget strong) {
  color: var(--ion-color-primary);
  font-weight: 600;
}

:deep(.marker-popup .details-btn) {
  background: var(--ion-color-primary);
  color: var(--app-text-primary);
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  min-height: 44px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

:deep(.marker-popup .details-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

/* Responsive */
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

  .status-indicator {
    top: 14px;
    left: 14px;
    box-shadow: 0 3px 12px rgba(255, 193, 7, 0.3);
  }

  .status-indicator ion-icon {
    font-size: 15px;
  }
}
</style>
