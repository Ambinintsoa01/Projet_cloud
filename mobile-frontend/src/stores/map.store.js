import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMapStore = defineStore('map', () => {
  // État
  const center = ref([-18.8792, 47.5079]) // Centre d'Antananarivo
  const zoom = ref(13)
  const userLocation = ref(null)
  const selectedLocation = ref(null)
  const isFollowingUser = ref(false)
  const mapInstance = ref(null)
  const markers = ref([])
  const clusters = ref([])

  // Configuration de la carte
  const mapConfig = ref({
    minZoom: 12,
    maxZoom: 18,
    zoomControl: false, // On utilise les contrôles Ionic
    attributionControl: true,
    scrollWheelZoom: true,
    dragging: true,
    touchZoom: true,
    doubleClickZoom: true,
    boxZoom: false,
    keyboard: false
  })

  // Tuiles de la carte
  const tileLayer = ref({
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }
  })

  // Getters
  const getCenter = computed(() => center.value)
  const getZoom = computed(() => zoom.value)
  const getUserLocation = computed(() => userLocation.value)
  const hasUserLocation = computed(() => !!userLocation.value)
  const getSelectedLocation = computed(() => selectedLocation.value)

  // Actions
  function setCenter(newCenter) {
    center.value = Array.isArray(newCenter) ? newCenter : [newCenter.lat, newCenter.lng]
  }

  function setZoom(newZoom) {
    zoom.value = Math.max(mapConfig.value.minZoom, Math.min(mapConfig.value.maxZoom, newZoom))
  }

  function updateUserLocation(location) {
    userLocation.value = {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp
    }

    // Si on suit l'utilisateur, centrer la carte sur sa position
    if (isFollowingUser.value) {
      setCenter([location.coords.latitude, location.coords.longitude])
    }
  }

  function setSelectedLocation(location) {
    selectedLocation.value = location ? {
      lat: location.lat,
      lng: location.lng,
      address: location.address || null
    } : null
  }

  function setFollowingUser(following) {
    isFollowingUser.value = following
  }

  function centerOnUser() {
    if (userLocation.value) {
      setCenter([userLocation.value.lat, userLocation.value.lng])
      setZoom(16) // Zoom plus rapproché pour voir la position
    }
  }

  function centerOnAntananarivo() {
    setCenter([-18.8792, 47.5079])
    setZoom(13)
  }

  function fitBounds(bounds) {
    // Cette fonction serait utilisée pour ajuster la vue sur des marqueurs
    // L'implémentation dépendrait de l'instance Leaflet
    if (mapInstance.value && bounds) {
      mapInstance.value.fitBounds(bounds)
    }
  }

  function addMarker(marker) {
    markers.value.push({
      id: marker.id || `marker_${Date.now()}`,
      position: [marker.lat, marker.lng],
      type: marker.type || 'default',
      data: marker.data || {},
      popup: marker.popup || null
    })
  }

  function removeMarker(markerId) {
    const index = markers.value.findIndex(m => m.id === markerId)
    if (index > -1) {
      markers.value.splice(index, 1)
    }
  }

  function clearMarkers() {
    markers.value = []
  }

  function setMapInstance(instance) {
    mapInstance.value = instance
  }

  // Simulation de géolocalisation pour les tests (sans GPS réel)
  function simulateUserLocation() {
    // Position mock près du centre d'Antananarivo
    const mockLocation = {
      coords: {
        latitude: -18.8792 + (Math.random() - 0.5) * 0.01, // Variation aléatoire
        longitude: 47.5079 + (Math.random() - 0.5) * 0.01,
        accuracy: 10 + Math.random() * 20 // Précision entre 10-30m
      },
      timestamp: Date.now()
    }

    updateUserLocation(mockLocation)
    return mockLocation
  }

  // Géocodage inverse simulé (retourne une adresse fictive)
  async function reverseGeocode(lat, lng) {
    // Simulation d'appel API avec délai
    await new Promise(resolve => setTimeout(resolve, 800))

    // Adresses fictives basées sur la position
    const addresses = [
      'Rue Andriantsihorisoa, Antananarivo',
      'Avenue de l\'Indépendance, Antananarivo',
      'Boulevard de l\'Europe, Antananarivo',
      'Rue Ratsimilaho, Antananarivo',
      'Place du 13 Mai, Antananarivo',
      'Rue Pasteur, Antananarivo',
      'Rue Indira Gandhi, Antananarivo',
      'Carrefour Analakely, Antananarivo'
    ]

    const randomAddress = addresses[Math.floor(Math.random() * addresses.length)]

    return {
      address: randomAddress,
      details: `Coordonnées: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  // Réinitialisation de l'état
  function reset() {
    center.value = [-18.8792, 47.5079]
    zoom.value = 13
    userLocation.value = null
    selectedLocation.value = null
    isFollowingUser.value = false
    markers.value = []
    clusters.value = []
  }

  return {
    // État
    center,
    zoom,
    userLocation,
    selectedLocation,
    isFollowingUser,
    mapInstance,
    markers,
    clusters,
    mapConfig,
    tileLayer,

    // Getters
    getCenter,
    getZoom,
    getUserLocation,
    hasUserLocation,
    getSelectedLocation,

    // Actions
    setCenter,
    setZoom,
    updateUserLocation,
    setSelectedLocation,
    setFollowingUser,
    centerOnUser,
    centerOnAntananarivo,
    fitBounds,
    addMarker,
    removeMarker,
    clearMarkers,
    setMapInstance,
    simulateUserLocation,
    reverseGeocode,
    reset
  }
})
