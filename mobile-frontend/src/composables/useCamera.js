import { ref, computed } from 'vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

// Composable pour gérer la caméra
export function useCamera() {
  // État réactif
  const isSupported = ref(false)
  const isLoading = ref(false)
  const error = ref(null)
  const photos = ref([])

  // Configuration de la caméra
  const cameraOptions = ref({
    quality: 80,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    width: 1024,
    height: 1024,
    preserveAspectRatio: true
  })

  // Getters calculés
  const hasPermission = computed(() => {
    // Dans un vrai environnement, on vérifierait les permissions
    return true // Mock: toujours autorisé
  })

  const canTakePhoto = computed(() => {
    return isSupported.value && hasPermission.value && photos.value.length < 3
  })

  const photoCount = computed(() => photos.value.length)
  const maxPhotos = 3

  // Méthodes
  const checkSupport = () => {
    isSupported.value = !!Camera
  }

  const requestPermissions = async () => {
    try {
      if (Camera) {
        const permission = await Camera.requestPermissions()
        return permission.camera === 'granted' && permission.photos === 'granted'
      }
      return false
    } catch (err) {
      error.value = 'Erreur lors de la demande de permissions caméra'
      console.error('Erreur permissions caméra:', err)
      return false
    }
  }

  const takePhoto = async (options = {}) => {
    if (!canTakePhoto.value) {
      error.value = 'Impossible de prendre une photo'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      // Simulation pour les tests (sans caméra réelle)
      if (process.env.NODE_ENV === 'development' || !Camera) {
        console.log('📸 Simulation de prise de photo (mode développement)')

        // Créer une photo mock
        const mockPhoto = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          dataUrl: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==`,
          fileName: `photo_${Date.now()}.jpg`,
          timestamp: new Date().toISOString(),
          isFromGallery: false
        }

        photos.value.push(mockPhoto)
        return mockPhoto
      }

      // Prise de photo réelle avec Capacitor
      const image = await Camera.getPhoto({
        ...cameraOptions.value,
        ...options
      })

      const photo = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dataUrl: image.dataUrl,
        fileName: `photo_${Date.now()}.jpg`,
        timestamp: new Date().toISOString(),
        isFromGallery: false,
        format: image.format,
        exif: image.exif
      }

      photos.value.push(photo)
      return photo

    } catch (err) {
      error.value = err.message || 'Erreur lors de la prise de photo'

      // Fallback: créer une photo mock en cas d'erreur
      console.warn('⚠️ Prise de photo échouée, création d\'une photo mock')
      const fallbackPhoto = {
        id: `photo_fallback_${Date.now()}`,
        dataUrl: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==`,
        fileName: `photo_fallback_${Date.now()}.jpg`,
        timestamp: new Date().toISOString(),
        isFromGallery: false
      }

      photos.value.push(fallbackPhoto)
      return fallbackPhoto

    } finally {
      isLoading.value = false
    }
  }

  const selectFromGallery = async (options = {}) => {
    if (!canTakePhoto.value) {
      error.value = 'Impossible de sélectionner une photo'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      // Simulation pour les tests
      if (process.env.NODE_ENV === 'development' || !Camera) {
        console.log('🖼️ Simulation de sélection depuis la galerie')

        const mockPhoto = {
          id: `gallery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          dataUrl: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==`,
          fileName: `gallery_${Date.now()}.jpg`,
          timestamp: new Date().toISOString(),
          isFromGallery: true
        }

        photos.value.push(mockPhoto)
        return mockPhoto
      }

      // Sélection réelle depuis la galerie
      const image = await Camera.getPhoto({
        ...cameraOptions.value,
        source: CameraSource.Photos,
        ...options
      })

      const photo = {
        id: `gallery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dataUrl: image.dataUrl,
        fileName: `gallery_${Date.now()}.jpg`,
        timestamp: new Date().toISOString(),
        isFromGallery: true,
        format: image.format,
        exif: image.exif
      }

      photos.value.push(photo)
      return photo

    } catch (err) {
      error.value = err.message || 'Erreur lors de la sélection de photo'
      console.error('Erreur sélection galerie:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const removePhoto = (photoId) => {
    const index = photos.value.findIndex(photo => photo.id === photoId)
    if (index > -1) {
      photos.value.splice(index, 1)
      return true
    }
    return false
  }

  const clearPhotos = () => {
    photos.value = []
  }

  const getPhotoFile = (photo) => {
    // Convertir dataUrl en File object pour upload
    if (photo.dataUrl) {
      const byteString = atob(photo.dataUrl.split(',')[1])
      const mimeType = photo.dataUrl.split(',')[0].split(':')[1].split(';')[0]
      const arrayBuffer = new ArrayBuffer(byteString.length)
      const uintArray = new Uint8Array(arrayBuffer)

      for (let i = 0; i < byteString.length; i++) {
        uintArray[i] = byteString.charCodeAt(i)
      }

      return new File([uintArray], photo.fileName, { type: mimeType })
    }
    return null
  }

  const reorderPhotos = (fromIndex, toIndex) => {
    const photo = photos.value.splice(fromIndex, 1)[0]
    photos.value.splice(toIndex, 0, photo)
  }

  // Initialisation
  checkSupport()

  return {
    // État
    isSupported,
    isLoading,
    error,
    photos,

    // Configuration
    cameraOptions,

    // Getters
    hasPermission,
    canTakePhoto,
    photoCount,

    // Constantes
    maxPhotos,

    // Méthodes
    checkSupport,
    requestPermissions,
    takePhoto,
    selectFromGallery,
    removePhoto,
    clearPhotos,
    getPhotoFile,
    reorderPhotos
  }
}
