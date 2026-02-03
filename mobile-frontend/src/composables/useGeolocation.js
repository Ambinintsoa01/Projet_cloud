import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMapStore } from '@/stores/map.store'
import { Geolocation } from '@capacitor/geolocation'

// Composable pour gérer la géolocalisation
export function useGeolocation() {
  const mapStore = useMapStore()

  // État réactif
  const isSupported = ref(false)
  const isLoading = ref(false)
  const error = ref(null)
  const watchId = ref(null)

  // Getters calculés
  const currentPosition = computed(() => mapStore.userLocation)
  const hasPermission = computed(() => {
    // Dans un vrai environnement, on vérifierait les permissions
    return true // Mock: toujours autorisé
  })

  const isWatching = computed(() => !!watchId.value)

  // Méthodes
  const checkSupport = () => {
    isSupported.value = 'geolocation' in navigator || Geolocation
  }

  const requestPermissions = async () => {
    try {
      if (Geolocation) {
        // Utilisation de Capacitor Geolocation
        const permission = await Geolocation.requestPermissions()
        return permission.location === 'granted'
      } else {
        // Fallback pour le navigateur
        return true // Mock
      }
    } catch (err) {
      error.value = 'Erreur lors de la demande de permissions'
      console.error('Erreur permissions géolocalisation:', err)
      return false
    }
  }

  const getCurrentPosition = async (options = {}) => {
    isLoading.value = true
    error.value = null

    try {
      if (!isSupported.value) {
        throw new Error('La géolocalisation n\'est pas supportée')
      }

      // Simulation de géolocalisation pour les tests (sans GPS réel)
      if (process.env.NODE_ENV === 'development' || !Geolocation) {
        console.log('🔄 Simulation de géolocalisation (mode développement)')
        const mockLocation = mapStore.simulateUserLocation()
        mapStore.updateUserLocation(mockLocation)
        return mockLocation
      }

      // Géolocalisation réelle avec Capacitor
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
        ...options
      })

      mapStore.updateUserLocation(position)
      return position

    } catch (err) {
      error.value = err.message || 'Erreur lors de la géolocalisation'

      // Fallback: utiliser la simulation
      console.warn('⚠️ Géolocalisation réelle échouée, utilisation de la simulation')
      const mockLocation = mapStore.simulateUserLocation()
      mapStore.updateUserLocation(mockLocation)
      return mockLocation

    } finally {
      isLoading.value = false
    }
  }

  const watchPosition = async (options = {}) => {
    if (!isSupported.value) {
      error.value = 'La géolocalisation n\'est pas supportée'
      return null
    }

    try {
      if (Geolocation) {
        // Utilisation de Capacitor pour le suivi
        watchId.value = await Geolocation.watchPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
          ...options
        }, (position, err) => {
          if (err) {
            error.value = err.message
            console.error('Erreur de suivi géolocalisation:', err)
          } else {
            mapStore.updateUserLocation(position)
          }
        })
      } else {
        // Simulation pour les tests
        watchId.value = setInterval(() => {
          const mockLocation = mapStore.simulateUserLocation()
          mapStore.updateUserLocation(mockLocation)
        }, 10000) // Mise à jour toutes les 10 secondes
      }

      return watchId.value

    } catch (err) {
      error.value = err.message || 'Erreur lors du démarrage du suivi'
      console.error('Erreur watchPosition:', err)
      return null
    }
  }

  const stopWatching = () => {
    if (watchId.value) {
      if (Geolocation && typeof watchId.value === 'string') {
        Geolocation.clearWatch({ id: watchId.value })
      } else if (typeof watchId.value === 'number') {
        clearInterval(watchId.value)
      }
      watchId.value = null
    }
  }

  const centerOnUser = () => {
    if (currentPosition.value) {
      mapStore.centerOnUser()
    } else {
      // Obtenir la position puis centrer
      getCurrentPosition().then(() => {
        mapStore.centerOnUser()
      })
    }
  }

  const getDistance = (lat1, lng1, lat2, lng2) => {
    // Calcul de distance en kilomètres (formule de Haversine)
    const R = 6371 // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Initialisation
  onMounted(() => {
    checkSupport()
  })

  // Nettoyage
  onUnmounted(() => {
    stopWatching()
  })

  return {
    // État
    isSupported,
    isLoading,
    error,
    watchId,

    // Getters
    currentPosition,
    hasPermission,
    isWatching,

    // Méthodes
    checkSupport,
    requestPermissions,
    getCurrentPosition,
    watchPosition,
    stopWatching,
    centerOnUser,
    getDistance
  }
}
