<template>
  <div ref="clusterContainer" class="marker-cluster-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet.markercluster'

// Props
const props = defineProps({
  markers: {
    type: Array,
    default: () => []
  },
  map: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    default: () => ({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      removeOutsideVisibleBounds: true,
      animate: true,
      maxClusterRadius: 50,
      iconCreateFunction: null
    })
  }
})

// Emits
const emit = defineEmits(['marker-click', 'cluster-click'])

// État réactif
const clusterContainer = ref(null)
let markerClusterGroup = null
let markers = []

// Méthodes
const initializeCluster = () => {
  if (!props.map) return

  // Créer le groupe de clusters avec les options par défaut
  markerClusterGroup = L.markerClusterGroup({
    ...props.options,
    iconCreateFunction: props.options.iconCreateFunction || createClusterIcon
  })

  // Ajouter à la carte
  props.map.addLayer(markerClusterGroup)

  // Charger les marqueurs initiaux
  updateMarkers()
}

const createClusterIcon = (cluster) => {
  const childCount = cluster.getChildCount()

  let className = 'marker-cluster-'
  if (childCount < 10) {
    className += 'small'
  } else if (childCount < 100) {
    className += 'medium'
  } else {
    className += 'large'
  }

  return new L.DivIcon({
    html: `<div><span>${childCount}</span></div>`,
    className: `marker-cluster ${className}`,
    iconSize: new L.Point(40, 40)
  })
}

const updateMarkers = () => {
  if (!markerClusterGroup) return

  // Supprimer les anciens marqueurs
  markerClusterGroup.clearLayers()
  markers = []

  // Créer les nouveaux marqueurs
  props.markers.forEach(markerData => {
    const marker = createMarker(markerData)
    if (marker) {
      markers.push(marker)
      markerClusterGroup.addLayer(marker)
    }
  })
}

const createMarker = (markerData) => {
  // Créer l'icône personnalisée
  const icon = createMarkerIcon(markerData)

  // Créer le marqueur Leaflet
  const marker = L.marker([markerData.lat, markerData.lng], {
    icon,
    ...markerData.options
  })

  // Ajouter un popup si défini
  if (markerData.popup) {
    marker.bindPopup(markerData.popup)
  }

  // Gestionnaire de clic
  marker.on('click', (e) => {
    emit('marker-click', {
      marker: markerData,
      leafletMarker: marker,
      event: e
    })
  })

  return marker
}

const createMarkerIcon = (markerData) => {
  // Icône par défaut
  const defaultIcon = {
    className: 'custom-marker',
    html: '<div class="marker-pin">📍</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  }

  // Personnaliser selon le type de marqueur
  if (markerData.type === 'user') {
    return L.divIcon({
      ...defaultIcon,
      html: '<div class="marker-pin user-location">📍</div>',
      className: 'custom-marker user-marker'
    })
  }

  if (markerData.type === 'report') {
    const statusEmojis = {
      new: '🔴',
      in_progress: '🟡',
      completed: '🟢'
    }

    const emoji = statusEmojis[markerData.status] || '📍'

    return L.divIcon({
      ...defaultIcon,
      html: `<div class="marker-pin report-marker">${emoji}</div>`,
      className: `custom-marker report-marker marker-${markerData.status}`
    })
  }

  return L.divIcon(defaultIcon)
}

const addMarker = (markerData) => {
  const marker = createMarker(markerData)
  if (marker && markerClusterGroup) {
    markers.push(marker)
    markerClusterGroup.addLayer(marker)
  }
  return marker
}

const removeMarker = (markerToRemove) => {
  if (!markerClusterGroup) return

  const index = markers.findIndex(marker =>
    marker.getLatLng().lat === markerToRemove.lat &&
    marker.getLatLng().lng === markerToRemove.lng
  )

  if (index > -1) {
    markerClusterGroup.removeLayer(markers[index])
    markers.splice(index, 1)
  }
}

const clearMarkers = () => {
  if (markerClusterGroup) {
    markerClusterGroup.clearLayers()
  }
  markers = []
}

const getBounds = () => {
  if (markers.length === 0) return null

  const group = new L.featureGroup(markers)
  return group.getBounds()
}

const zoomToShowAll = () => {
  if (props.map && markers.length > 0) {
    const bounds = getBounds()
    if (bounds) {
      props.map.fitBounds(bounds, { padding: [20, 20] })
    }
  }
}

// Écouteurs d'événements du cluster
const setupClusterEvents = () => {
  if (!markerClusterGroup) return

  markerClusterGroup.on('clusterclick', (e) => {
    emit('cluster-click', {
      cluster: e.layer,
      markers: e.layer.getAllChildMarkers(),
      event: e
    })
  })
}

// Watchers
watch(() => props.markers, updateMarkers, { deep: true })

watch(() => props.map, (newMap) => {
  if (newMap && !markerClusterGroup) {
    initializeCluster()
  }
})

// Cycle de vie
onMounted(() => {
  if (props.map) {
    initializeCluster()
    setupClusterEvents()
  }
})

onUnmounted(() => {
  if (markerClusterGroup && props.map) {
    props.map.removeLayer(markerClusterGroup)
  }
})
</script>

<style scoped>
.marker-cluster-container {
  /* Ce conteneur n'est pas utilisé directement par Leaflet */
  display: none;
}

/* Styles pour les clusters */
:deep(.marker-cluster-small) {
  background-color: rgba(181, 226, 140, 0.6);
}

:deep(.marker-cluster-small div) {
  background-color: rgba(110, 204, 57, 0.6);
}

:deep(.marker-cluster-medium) {
  background-color: rgba(241, 211, 87, 0.6);
}

:deep(.marker-cluster-medium div) {
  background-color: rgba(240, 194, 12, 0.6);
}

:deep(.marker-cluster-large) {
  background-color: rgba(253, 156, 115, 0.6);
}

:deep(.marker-cluster-large div) {
  background-color: rgba(241, 128, 23, 0.6);
}

:deep(.marker-cluster) {
  border-radius: 50%;
  text-align: center;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

:deep(.marker-cluster div) {
  border-radius: 50%;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 12px;
}

:deep(.marker-cluster span) {
  line-height: 1;
}

/* Styles pour les marqueurs personnalisés */
:deep(.custom-marker) {
  background: none;
  border: none;
}

:deep(.marker-pin) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  font-size: 14px;
  background-color: var(--ion-color-primary);
  color: white;
}

:deep(.user-marker .marker-pin) {
  background-color: #007bff;
  border-color: #0056b3;
}

:deep(.report-marker.marker-new .marker-pin) {
  background-color: #dc3545;
  border-color: #bd2130;
}

:deep(.report-marker.marker-in_progress .marker-pin) {
  background-color: #ffc107;
  border-color: #e0a800;
  color: #212529;
}

:deep(.report-marker.marker-completed .marker-pin) {
  background-color: #28a745;
  border-color: #1e7e34;
}

/* Animation d'entrée */
@keyframes markerBounce {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}

:deep(.custom-marker.animated .marker-pin) {
  animation: markerBounce 0.5s ease-out;
}
</style>
