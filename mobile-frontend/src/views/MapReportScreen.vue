<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon name="arrow-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>
          <span class="app-logo">ROAD ALERT</span>
          <span class="title-sep">•</span>
          <span class="app-title">Signaler un problème</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="map-report-content">
      <!-- Carte interactive -->
      <div ref="mapContainer" class="map-container"></div>

      <!-- Instructions -->
      <div v-if="!selectedLocation" class="map-instructions">
        <div class="instruction-card">
          <ion-icon name="location" size="large" color="primary"></ion-icon>
          <h3>Touchez la carte</h3>
          <p>Cliquez sur l'emplacement exact du problème à signaler</p>
        </div>
      </div>

      <!-- Panneau de détails -->
      <div v-if="selectedLocation" class="report-panel">
        <!-- Debug info -->
        <div style="background: yellow; padding: 5px; margin: 5px 0;">
          DEBUG: selectedLocation = {{ selectedLocation ? 'EXISTE' : 'NULL' }}
        </div>
        
        <div class="panel-header">
          <div class="location-info">
            <ion-icon name="location" color="primary"></ion-icon>
            <div class="coordinates">
              <small>{{ selectedLocation.lat.toFixed(6) }}, {{ selectedLocation.lng.toFixed(6) }}</small>
            </div>
          </div>
          <ion-button fill="clear" size="small" @click="clearLocation">
            <ion-icon name="close" color="medium"></ion-icon>
          </ion-button>
        </div>

        <!-- Formulaire -->
        <div class="report-form">
          <!-- Description -->
          <ion-item class="form-item">
            <ion-label position="floating">Description du problème *</ion-label>
            <ion-textarea
              v-model="reportData.description"
              placeholder="Décrivez le problème (nid de poule, route dégradée, etc.)"
              :counter="true"
              maxlength="300"
              rows="3"
              :class="{ 'ion-invalid': errors.description }"
            ></ion-textarea>
            <ion-note v-if="errors.description" slot="error" color="danger">
              {{ errors.description }}
            </ion-note>
          </ion-item>

          <!-- Type de problème -->
          <ion-item>
            <ion-label>Type de problème</ion-label>
            <ion-select v-model="reportData.typeId" placeholder="Choisissez un type (optionnel)">
              <ion-select-option value="">Non spécifié</ion-select-option>
              <ion-select-option value="nid_de_poule">Nid de poule</ion-select-option>
              <ion-select-option value="route_degradee">Route dégradée</ion-select-option>
              <ion-select-option value="travaux">Travaux</ion-select-option>
              <ion-select-option value="accident">Accident</ion-select-option>
              <ion-select-option value="autre">Autre</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Photos (obligatoire) -->
          <div class="photos-section">
            <div class="section-header">
              <h4>Photos *</h4>
              <span class="photo-count">({{ photos.length }}/3 min)</span>
            </div>
            
            <!-- Upload simple -->
            <div class="simple-upload">
              <div v-for="(photo, index) in photos" :key="photo.id" class="photo-preview">
                <img :src="photo.dataUrl" class="photo-img" />
                <button @click="removePhoto(photo.id)" class="remove-btn">×</button>
              </div>
              
              <button v-if="photos.length < 3" @click="addPhoto" class="add-photo-btn">
                <div class="add-icon">+</div>
                <span>Ajouter</span>
              </button>
            </div>
            
            <ion-note v-if="errors.photos" color="danger">
              {{ errors.photos }}
            </ion-note>
          </div>

          <!-- Bouton de soumission -->
          <ion-button
            expand="block"
            @click="submitReport"
            :disabled="!isFormValid || isSubmitting"
            class="submit-button"
            size="large"
          >
            <ion-spinner v-if="isSubmitting" slot="start" name="crescent"></ion-spinner>
            <ion-icon v-else name="send" slot="start"></ion-icon>
            Envoyer le signalement
          </ion-button>

          <!-- Bouton de test FORCÉ -->
          <ion-button
            expand="block"
            @click="forceSubmit"
            color="warning"
            fill="outline"
            size="small"
            style="margin-top: 10px;"
          >
            🚨 FORCER L'ENVOI (test)
          </ion-button>
        </div>
      </div>

      <!-- Indicateur de chargement -->
      <div v-if="isLoading" class="loading-overlay">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Chargement de la carte...</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonNote,
  IonSpinner,
  toastController,
  alertController
} from '@ionic/vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import { Geolocation } from '@capacitor/geolocation'
import PhotoUploader from '@/components/report/PhotoUploader.vue'
import { reportService } from '@/services/report.service'
import { useAuthStore } from '@/stores/auth.store'
import { db, storage } from '@/services/firebase.service'

const router = useRouter()
const authStore = useAuthStore()

// Références
const mapContainer = ref(null)
let map = null
let marker = null

// État
const isLoading = ref(true)
const isSubmitting = ref(false)
const selectedLocation = ref(null)
const photos = ref([])

// Données du formulaire
const reportData = ref({
  description: '',
  typeId: '',
  latitude: null,
  longitude: null,
  address: ''
})

// Validation
const errors = ref({
  description: '',
  photos: ''
})

// Computed
const isFormValid = computed(() => {
  return (
    selectedLocation.value &&
    reportData.value.description.trim().length >= 10 &&
    photos.value.length >= 1 &&
    !errors.value.description &&
    !errors.value.photos
  )
})

// Initialisation de la carte
const initMap = async () => {
  try {
    isLoading.value = true
    
    // Créer la carte avec un centre par défaut
    map = L.map(mapContainer.value).setView([-18.8792, 47.5079], 13)

    // Ajouter la couche OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    // Gestion du clic sur la carte
    map.on('click', onMapClick)

    // Obtenir la position actuelle (en arrière-plan pour ne pas bloquer)
    getCurrentLocation().catch(() => {
      console.log('Position GPS non disponible, utilisation de la position par défaut')
    })

    isLoading.value = false
  } catch (error) {
    console.error('Erreur initialisation carte:', error)
    isLoading.value = false
    showToast('Erreur lors du chargement de la carte', 'danger')
  }
}

// Gestion du clic sur la carte
const onMapClick = (e) => {
  const { lat, lng } = e.latlng
  setSelectedLocation(lat, lng)
  
  // Forcer l'affichage du formulaire immédiatement
  setTimeout(() => {
    const panel = document.querySelector('.report-panel')
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

// Définir la localisation sélectionnée
const setSelectedLocation = (lat, lng) => {
  console.log('setSelectedLocation appelée:', lat, lng)
  selectedLocation.value = { lat, lng }
  reportData.value.latitude = lat
  reportData.value.longitude = lng
  console.log('selectedLocation après mise à jour:', selectedLocation.value)

  // Mettre à jour le marqueur
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng], {
      draggable: true
    }).addTo(map)

    // Permettre le déplacement du marqueur
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng()
      setSelectedLocation(lat, lng)
    })
  }

  // Centrer la carte sur le marqueur
  map.panTo([lat, lng])
}

// Obtenir la position actuelle
const getCurrentLocation = async () => {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false, // Plus rapide
      timeout: 5000 // Plus court timeout
    })

    const { latitude, longitude } = position.coords
    setSelectedLocation(latitude, longitude)
    
    // Zoom sur la position actuelle
    if (map) {
      map.setView([latitude, longitude], 15)
    }
  } catch (error) {
    console.warn('Impossible d\'obtenir la position:', error)
    // Continuer sans position GPS
  }
}

// Effacer la localisation
const clearLocation = () => {
  selectedLocation.value = null
  reportData.value.latitude = null
  reportData.value.longitude = null
  
  if (marker) {
    map.removeLayer(marker)
    marker = null
  }
}

// Gestion des photos
const addPhoto = async () => {
  try {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          photos.value.push({
            id: Date.now().toString(),
            dataUrl: e.target.result,
            name: file.name
          })
          errors.value.photos = ''
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  } catch (error) {
    console.error('Erreur ajout photo:', error)
  }
}

const removePhoto = (photoId) => {
  photos.value = photos.value.filter(p => p.id !== photoId)
}

const onPhotoView = (photo) => {
  console.log('View photo:', photo)
}

// Validation du formulaire
const validateForm = () => {
  console.log('Début validation...')
  errors.value = {
    description: '',
    photos: ''
  }

  let isValid = true

  // Validation description
  if (!reportData.value.description || reportData.value.description.trim().length < 5) {
    errors.value.description = 'La description doit contenir au moins 5 caractères'
    isValid = false
    console.log('Description invalide:', reportData.value.description)
  }

  // Validation photos
  if (!photos.value || photos.value.length === 0) {
    errors.value.photos = 'Au moins une photo est obligatoire'
    isValid = false
    console.log('Photos invalides:', photos.value)
  }

  // Validation localisation
  if (!selectedLocation.value) {
    console.log('Localisation manquante:', selectedLocation.value)
    isValid = false
  }

  console.log('Validation résultat:', isValid, errors.value)
  return isValid
}

// Soumettre le signalement
const submitReport = async () => {
  console.log('submitReport appelé')
  console.log('isFormValid:', isFormValid.value)
  console.log('selectedLocation:', selectedLocation.value)
  console.log('description:', reportData.value.description)
  console.log('photos:', photos.value)
  
  if (!validateForm()) {
    console.log('Validation échouée')
    return
  }

  try {
    isSubmitting.value = true
    console.log('Début de la soumission...')
    
    const reportPayload = {
      ...reportData.value,
      userId: authStore.user?.id || 'demo-user',
      userName: authStore.user?.name || 'Utilisateur',
      userEmail: authStore.user?.email || 'demo@example.com',
      status: 'new',
      createdAt: new Date().toISOString()
    }

    console.log('Envoi du signalement:', reportPayload)
    console.log('Photos:', photos.value)

    // Simulation d'envoi (remplacer par vrai appel API)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    showToast('Signalement envoyé avec succès !', 'success')
    
    // Rediriger vers la carte principale
    setTimeout(() => {
      router.push('/map')
    }, 2000)

  } catch (error) {
    console.error('Erreur soumission:', error)
    showToast('Erreur lors de l\'envoi du signalement', 'danger')
  } finally {
    isSubmitting.value = false
  }
}

// Forcer l'envoi (contourne la validation)
const forceSubmit = async () => {
  console.log('FORCE SUBMIT appelé')
  
  try {
    isSubmitting.value = true
    
    const reportPayload = {
      description: reportData.value.description || 'Test forcé',
      latitude: selectedLocation.value?.lat || -18.8792,
      longitude: selectedLocation.value?.lng || 47.5079,
      userId: 'test-user',
      userName: 'Test User',
      userEmail: 'test@example.com',
      status: 'new',
      createdAt: new Date().toISOString()
    }

    console.log('ENVOI FORCÉ:', reportPayload)

    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showToast('Signalement FORCÉ envoyé !', 'success')
    
    setTimeout(() => {
      router.push('/map')
    }, 1500)

  } catch (error) {
    console.error('Erreur envoi forcé:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Toast helper
const showToast = async (message, color = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'bottom'
  })
  await toast.present()
}

// Navigation
const goBack = () => {
  router.back()
}

// Cycle de vie
onMounted(() => {
  // Forcer l'initialisation après un court délai
  setTimeout(() => {
    initMap()
  }, 100)
  
  // Timeout de sécurité : si la carte ne charge pas après 5 secondes
  setTimeout(() => {
    if (isLoading.value) {
      isLoading.value = false
      console.warn('Timeout : la carte ne s\'est pas initialisée correctement')
    }
  }, 5000)
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})
</script>

<style scoped>
.map-report-content {
  position: relative;
}

.map-container {
  height: 50vh;
  width: 100%;
  z-index: 1;
}

.map-instructions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  text-align: center;
}

.instruction-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  max-width: 300px;
}

.instruction-card h3 {
  margin: 1rem 0 0.5rem 0;
  color: var(--ion-color-primary);
}

.instruction-card p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.report-panel {
  background: white;
  border-radius: 20px 20px 0 0;
  margin-top: -20px;
  padding: 1.5rem;
  min-height: 50vh;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 5;
  position: relative;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ion-color-light);
}

.location-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.coordinates small {
  color: var(--ion-color-medium);
  font-family: monospace;
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-item {
  --background: var(--ion-color-light);
  border-radius: 12px;
  margin: 0;
}

.photos-section {
  margin: 1rem 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  color: var(--ion-color-dark);
}

.photo-count {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.submit-button {
  margin-top: 1.5rem;
  height: 50px;
  --border-radius: 12px;
  font-weight: 600;
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
  justify-content: center;
  align-items: center;
  z-index: 100;
  gap: 1rem;
}

.loading-overlay p {
  margin: 0;
  color: var(--ion-color-medium);
}

/* Upload simple de photos */
.simple-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0;
}

.photo-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-photo-btn {
  width: 80px;
  height: 80px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-photo-btn:hover {
  border-color: #2196f3;
  background: #e3f2fd;
}

.add-icon {
  font-size: 24px;
  color: #666;
  margin-bottom: 4px;
}

.add-photo-btn span {
  font-size: 10px;
  color: #666;
}

/* Responsive */
@media (max-width: 768px) {
  .map-container {
    height: 40vh;
  }
  
  .report-panel {
    padding: 1rem;
  }
}
</style>
