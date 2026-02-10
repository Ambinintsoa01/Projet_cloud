import { ref, computed } from 'vue'
import { Capacitor } from '@capacitor/core'
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
    return hasPermission.value && photos.value.length < 3
  })

  const photoCount = computed(() => photos.value.length)
  const maxPhotos = 3

  // Méthodes
  const checkSupport = () => {
    // Camera est un plugin Capacitor. Si l'import existe, on considère supporté.
    isSupported.value = !!Camera
  }

  const requestPermissions = async () => {
    try {
      // Sur le Web, pas de permissions Capacitor à demander ici.
      if (Capacitor.getPlatform() === 'web') {
        return true
      }

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

  const pickImageFromFileInput = ({ capture } = { capture: false }) => {
    return new Promise((resolve, reject) => {
      try {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'

        // Sur mobile web: capture => ouvre directement l'appareil photo (si supporté)
        if (capture) {
          input.setAttribute('capture', 'environment')
        }

        input.onchange = () => {
          const file = input.files && input.files[0]
          if (!file) {
            reject(new Error('Sélection annulée'))
            return
          }

          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              dataUrl: reader.result,
              fileName: file.name,
              type: file.type,
              size: file.size
            })
          }
          reader.onerror = () => {
            reject(new Error('Erreur lecture fichier'))
          }
          reader.readAsDataURL(file)
        }

        input.click()
      } catch (e) {
        reject(e)
      }
    })
  }

  const captureFromWebcam = () => {
    return new Promise(async (resolve, reject) => {
      let stream = null
      let overlay = null

      const cleanup = () => {
        try {
          if (stream) {
            stream.getTracks().forEach(t => t.stop())
          }
        } catch (e) {
          // noop
        }
        try {
          if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay)
          }
        } catch (e) {
          // noop
        }
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Webcam non supportée par ce navigateur')
        }

        overlay = document.createElement('div')
        overlay.style.position = 'fixed'
        overlay.style.inset = '0'
        overlay.style.background = 'rgba(0,0,0,0.8)'
        overlay.style.display = 'flex'
        overlay.style.flexDirection = 'column'
        overlay.style.alignItems = 'center'
        overlay.style.justifyContent = 'center'
        overlay.style.zIndex = '99999'
        overlay.style.padding = '16px'

        const video = document.createElement('video')
        video.autoplay = true
        video.playsInline = true
        video.style.width = '100%'
        video.style.maxWidth = '520px'
        video.style.borderRadius = '12px'
        video.style.background = '#000'

        const buttons = document.createElement('div')
        buttons.style.display = 'flex'
        buttons.style.gap = '12px'
        buttons.style.marginTop = '16px'

        const captureBtn = document.createElement('button')
        captureBtn.type = 'button'
        captureBtn.textContent = 'Capturer'
        captureBtn.style.padding = '12px 16px'
        captureBtn.style.borderRadius = '10px'
        captureBtn.style.border = 'none'
        captureBtn.style.background = '#ffc107'
        captureBtn.style.color = '#000'
        captureBtn.style.fontWeight = '700'
        captureBtn.style.cursor = 'pointer'

        const cancelBtn = document.createElement('button')
        cancelBtn.type = 'button'
        cancelBtn.textContent = 'Annuler'
        cancelBtn.style.padding = '12px 16px'
        cancelBtn.style.borderRadius = '10px'
        cancelBtn.style.border = '1px solid rgba(255,255,255,0.35)'
        cancelBtn.style.background = 'transparent'
        cancelBtn.style.color = '#fff'
        cancelBtn.style.fontWeight = '700'
        cancelBtn.style.cursor = 'pointer'

        buttons.appendChild(captureBtn)
        buttons.appendChild(cancelBtn)

        overlay.appendChild(video)
        overlay.appendChild(buttons)
        document.body.appendChild(overlay)

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        })
        video.srcObject = stream

        cancelBtn.onclick = () => {
          cleanup()
          reject(new Error('Capture annulée'))
        }

        captureBtn.onclick = () => {
          try {
            const w = video.videoWidth || 1280
            const h = video.videoHeight || 720
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d')
            ctx.drawImage(video, 0, 0, w, h)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
            cleanup()
            resolve({ dataUrl, fileName: `webcam_${Date.now()}.jpg` })
          } catch (e) {
            cleanup()
            reject(e)
          }
        }
      } catch (e) {
        cleanup()
        reject(e)
      }
    })
  }

  const takePhoto = async (options = {}) => {
    if (!canTakePhoto.value) {
      error.value = 'Impossible de prendre une photo'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      console.log('📸 Prise de photo réelle...')

      const platform = Capacitor.getPlatform()

      // WEB: utiliser la webcam (getUserMedia)
      if (platform === 'web') {
        const image = await captureFromWebcam()
        const photo = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          dataUrl: image.dataUrl,
          fileName: image.fileName || `photo_${Date.now()}.jpg`,
          timestamp: new Date().toISOString(),
          isFromGallery: false
        }
        photos.value.push(photo)
        return photo
      }

      // NATIVE (Android/iOS)
      if (!Camera) {
        throw new Error('Camera non disponible sur cet appareil')
      }

      const permissions = await Camera.requestPermissions()
      if (permissions.camera !== 'granted') {
        throw new Error('Permission caméra refusée')
      }

      const image = await Camera.getPhoto({
        ...cameraOptions.value,
        source: CameraSource.Camera,
        resultType: CameraResultType.DataUrl,
        ...options
      })

      console.log('✅ Photo prise avec succès:', image.dataUrl.substring(0, 50) + '...')

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
      console.error('❌ Erreur prise de photo réelle:', err)
      return null
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
      console.log('🖼️ Sélection réelle depuis la galerie...')

      const platform = Capacitor.getPlatform()

      // WEB: utiliser un input file (sans capture) => galerie/fichier
      if (platform === 'web') {
        const image = await pickImageFromFileInput({ capture: false })
        const photo = {
          id: `gallery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          dataUrl: image.dataUrl,
          fileName: image.fileName || `gallery_${Date.now()}.jpg`,
          timestamp: new Date().toISOString(),
          isFromGallery: true
        }
        photos.value.push(photo)
        return photo
      }

      // NATIVE (Android/iOS)
      if (!Camera) {
        throw new Error('Galerie non disponible sur cet appareil')
      }

      const permissions = await Camera.requestPermissions()
      if (permissions.photos !== 'granted') {
        throw new Error('Permission galerie refusée')
      }

      const image = await Camera.getPhoto({
        ...cameraOptions.value,
        source: CameraSource.Photos,
        resultType: CameraResultType.DataUrl,
        ...options
      })

      console.log('✅ Photo sélectionnée avec succès:', image.dataUrl.substring(0, 50) + '...')

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
      console.error('❌ Erreur sélection galerie réelle:', err)
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

  // Initialiser le support dès l'usage du composable
  checkSupport()

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
