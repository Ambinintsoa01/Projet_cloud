<template>
  <div class="location-picker">
    <div class="picker-header">
      <h3>{{ title }}</h3>
      <p>{{ subtitle }}</p>
    </div>

    <!-- Carte du sélecteur -->
    <div ref="mapContainer" class="picker-map"></div>

    <!-- Contrôles de la carte -->
    <div class="map-controls">
      <ion-button
        fill="solid"
        shape="round"
        size="small"
        @click="zoomIn"
        class="control-button"
      >
        <ion-icon name="add"></ion-icon>
      </ion-button>
      <ion-button
        fill="solid"
        shape="round"
        size="small"
        @click="zoomOut"
        class="control-button"
      >
        <ion-icon name="remove"></ion-icon>
      </ion-button>
    </div>

    <!-- Adresse sélectionnée -->
    <div v-if="selectedLocation" class="selected-address">
      <div class="address-display">
        <ion-icon name="location" color="primary"></ion-icon>
        <span>{{ selectedLocation.address || 'Adresse en cours de résolution...' }}</span>
      </div>
      <div class="coordinates">
        {{ selectedLocation.lat.toFixed(6) }}, {{ selectedLocation.lng.toFixed(6) }}
      </div>
    </div>

    <!-- Actions -->
    <div class="picker-actions">
      <ion-button
        fill="outline"
        @click="$emit('cancel')"
        class="action-button cancel"
      >
        Annuler
      </ion-button>
      <ion-button
        @click="confirmLocation"
        :disabled="!selectedLocation"
        class="action-button confirm"
      >
        Confirmer
      </ion-button>
    </div>
  </div>
</template>

<script setup>
import {
  IonButton,
  IonIcon
} from '@ionic/vue'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import { useMapStore } from '@/stores/map.store'

// Props
const props = defineProps({
  initialLocation: {
    type: Object,
    default: null
  },
  title: {
    type: String,
    default: 'Choisir l\'emplacement'
  },
  subtitle: {
    type: String,
    default: 'Appuyez sur la carte pour sélectionner un emplacement'
  }
})

// Emits
const emit = defineEmits(['confirm', 'cancel', 'location-selected'])

// État réactif
const mapContainer = ref(null)
let map = null
let marker = null
let selectedLocation = ref(null)

const mapStore = useMapStore()

// Méthodes
const initializeMap = async () => {
  if (!mapContainer.value) return

  // Configuration de Leaflet
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })

  // Centre initial
  const center = props.initialLocation
    ? [props.initialLocation.lat, props.initialLocation.lng]
    : mapStore.center

  // Création de la carte
  map = L.map(mapContainer.value, {
    center,
    zoom: 15,
    zoomControl: false,
    attributionControl: true,
    scrollWheelZoom: true,
    dragging: true,
    touchZoom: true,
    doubleClickZoom: true,
    boxZoom: false,
    keyboard: false
  })

  // Ajout du fond de carte
  L.tileLayer(mapStore.tileLayer.url, mapStore.tileLayer.options).addTo(map)

  // Gestionnaire de clic pour placer le marqueur
  map.on('click', async (e) => {
    const { lat, lng } = e.latlng
    await placeMarker(lat, lng)
  })

  // Placer le marqueur initial si fourni
  if (props.initialLocation) {
    await placeMarker(props.initialLocation.lat, props.initialLocation.lng)
  }
}

const placeMarker = async (lat, lng) => {
  // Créer ou déplacer le marqueur
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng]).addTo(map)
  }

  // Centrer la carte sur le marqueur
  map.setView([lat, lng], map.getZoom())

  // Résoudre l'adresse
  try {
    const geocoded = await mapStore.reverseGeocode(lat, lng)
    selectedLocation.value = {
      lat,
      lng,
      address: geocoded.address
    }
  } catch (error) {
    console.error('Erreur de géocodage:', error)
    selectedLocation.value = {
      lat,
      lng,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  emit('location-selected', selectedLocation.value)
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

const confirmLocation = () => {
  if (selectedLocation.value) {
    emit('confirm', selectedLocation.value)
  }
}

// Cycle de vie
onMounted(() => {
  // Délai pour s'assurer que le DOM est prêt
  setTimeout(() => {
    initializeMap()
  }, 100)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// Watchers
watch(() => props.initialLocation, (newLocation) => {
  if (newLocation && map) {
    placeMarker(newLocation.lat, newLocation.lng)
  }
})
</script>

<style scoped>
.location-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.picker-header {
  padding: 16px;
  border-bottom: 1px solid var(--ion-color-light);
  background: white;
}

.picker-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--ion-color-dark);
}

.picker-header p {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.picker-map {
  flex: 1;
  width: 100%;
  min-height: 300px;
  background: var(--ion-color-light);
}

.map-controls {
  position: absolute;
  top: 80px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-button {
  --border-radius: 50%;
  width: 36px;
  height: 36px;
  --padding-start: 0;
  --padding-end: 0;
}

.selected-address {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid var(--ion-color-light);
}

.address-display {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.address-display span {
  font-size: 16px;
  font-weight: 500;
  color: var(--ion-color-dark);
}

.coordinates {
  font-size: 12px;
  color: var(--ion-color-medium);
  font-family: monospace;
}

.picker-actions {
  padding: 16px;
  background: white;
  border-top: 1px solid var(--ion-color-light);
  display: flex;
  gap: 12px;
}

.action-button {
  flex: 1;
  --border-radius: var(--button-border-radius);
}

.action-button.cancel {
  --border-color: var(--ion-color-medium);
  --color: var(--ion-color-medium);
}

.action-button.confirm {
  --background: var(--ion-color-primary);
}

/* Responsive */
@media (max-width: 480px) {
  .picker-header {
    padding: 12px 16px;
  }

  .picker-header h3 {
    font-size: 16px;
  }

  .picker-header p {
    font-size: 13px;
  }

  .map-controls {
    top: 76px;
    right: 12px;
  }

  .control-button {
    width: 32px;
    height: 32px;
  }

  .selected-address {
    padding: 10px 16px;
  }

  .picker-actions {
    padding: 12px 16px;
    flex-direction: column;
  }
}
</style>
