<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button router-link="/map">
            <ion-icon name="arrow-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title v-if="isManager">Créer un signalement</ion-title>
        <ion-title v-else>Signaler un problème</ion-title>
      </ion-toolbar>

      <!-- Indicateur de progression -->
      <ion-toolbar class="progress-toolbar">
        <div class="progress-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
          <div class="step-indicators">
            <div
              v-for="step in 2"
              :key="step"
              class="step-indicator"
              :class="{
                active: currentStep >= step,
                completed: currentStep > step
              }"
            >
              <span v-if="currentStep > step">
                <ion-icon name="checkmark" size="small"></ion-icon>
              </span>
              <span v-else>{{ step }}</span>
            </div>
          </div>
          <p class="step-label">{{ currentStepLabel }}</p>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="form-content">
      <!-- Étape 1: Localisation -->
      <div v-if="currentStep === 1" class="step-container">
        <div class="step-header">
          <h2>Où se trouve le problème ?</h2>
          <p>Choisissez l'emplacement sur la carte ou utilisez votre position actuelle</p>
        </div>

        <!-- Carte miniature -->
        <div class="location-map" ref="locationMapContainer"></div>

        <!-- Options de localisation -->
        <div class="location-options">
          <ion-button
            expand="block"
            :disabled="isGettingLocation"
            @click="useCurrentLocation"
            class="location-button"
          >
            <ion-spinner v-if="isGettingLocation" slot="start" name="crescent"></ion-spinner>
            <ion-icon v-else name="locate" slot="start"></ion-icon>
            Utiliser ma position actuelle
          </ion-button>

          <div class="or-divider">
            <span>ou</span>
          </div>

          <ion-button
            expand="block"
            fill="outline"
            @click="openLocationPicker"
            class="location-button"
          >
            <ion-icon name="map" slot="start"></ion-icon>
            Choisir sur la carte
          </ion-button>
        </div>

        <!-- Adresse complémentaire -->
        <div class="address-section">
          <ion-item class="address-item">
            <ion-label position="floating">Adresse complémentaire (optionnel)</ion-label>
            <ion-input
              v-model="formData.addressComplement"
              placeholder="Précisions sur l'emplacement"
            ></ion-input>
          </ion-item>

          <!-- Coordonnées GPS -->
          <div v-if="formData.latitude && formData.longitude" class="coordinates-info">
            <p><strong>Latitude:</strong> {{ formData.latitude.toFixed(5) }}</p>
            <p><strong>Longitude:</strong> {{ formData.longitude.toFixed(5) }}</p>
          </div>
        </div>
      </div>

      <!-- Étape 2: Description du problème -->
      <div v-if="currentStep === 2" class="step-container">
        <div class="step-header">
          <h2>Décrivez le problème</h2>
          <p>Soyez concis et précis (un manager verra votre signalement)</p>
        </div>

        <!-- Description -->
        <ion-item class="form-item">
          <ion-label position="floating">Description *</ion-label>
          <ion-textarea
            v-model="formData.description"
            placeholder="Ex: Nid de poule sur la RN1, taille estimée 30cm..."
            :counter="true"
            maxlength="300"
            rows="4"
            @ion-input="validateField('description')"
            :class="{ 'ion-invalid': errors.description }"
          ></ion-textarea>
          <ion-note v-if="errors.description" slot="error" color="danger">
            {{ errors.description }}
          </ion-note>
        </ion-item>

        <!-- Type suggéré (optionnel) -->
        <ion-item>
          <ion-label>Type de problème (suggéré, optionnel)</ion-label>
          <ion-select
            v-model="formData.typeId"
            placeholder="Pas de type spécifique"
          >
            <ion-select-option value="">Pas de type</ion-select-option>
            <ion-select-option
              v-for="type in signalementTypes"
              :key="type.id"
              :value="type.id"
            >
              <span :style="{ color: getTypeColor(type.icon_color) }">
                {{ type.icon_symbol }} {{ type.libelle }}
              </span>
            </ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Affichage du type sélectionné (optionnel) -->
        <div v-if="selectedType" class="selected-type-card">
          <div class="type-icon" :style="{ borderColor: getTypeColor(selectedType.icon_color) }">
            {{ selectedType.icon_symbol }}
          </div>
          <div class="type-info">
            <h3>{{ selectedType.libelle }}</h3>
            <p :style="{ color: getTypeColor(selectedType.icon_color) }">
              Type suggéré
            </p>
          </div>
        </div>

        <!-- Info note -->
        <div class="info-box">
          <ion-icon name="information-circle"></ion-icon>
          <p>Les détails de conversion en signalement seront complétés par un manager</p>
        </div>
      </div>

      <!-- Modal du sélecteur de localisation -->
      <ion-modal
        :is-open="showLocationPicker"
        @did-dismiss="closeLocationPicker"
        class="location-picker-modal"
      >
        <ion-header>
          <ion-toolbar>
            <ion-title>
              <span class="app-logo">ROAD ALERT</span>
              <span class="title-sep">•</span>
              <span class="app-title">Choisir l'emplacement</span>
            </ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeLocationPicker">
                <ion-icon name="close"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content>
          <div class="picker-map" ref="pickerMapContainer"></div>
          <div class="picker-actions">
            <ion-button expand="block" @click="confirmLocation">
              Confirmer cet emplacement
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>

    <!-- Barre d'actions en bas -->
    <ion-footer>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button
            v-if="currentStep > 1"
            fill="clear"
            @click="previousStep"
            :disabled="isSubmitting"
          >
            <ion-icon name="arrow-back" slot="start"></ion-icon>
            Précédent
          </ion-button>
        </ion-buttons>

        <ion-buttons slot="end">
          <ion-button
            v-if="currentStep < 3"
            @click="nextStep"
            :disabled="!canGoNext || isSubmitting"
            class="next-button"
          >
            Suivant
            <ion-icon name="arrow-forward" slot="end"></ion-icon>
          </ion-button>

          <ion-button
            v-if="currentStep === 3"
            @click="submitReport"
            :disabled="!isFormValid || isSubmitting"
            class="submit-button"
          >
            <ion-spinner v-if="isSubmitting" slot="start" name="crescent"></ion-spinner>
            <ion-icon v-else name="send" slot="start"></ion-icon>
            {{ isManager ? 'Créer le signalement' : 'Signaler le problème' }}
          </ion-button>
        </ion-buttons>
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
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonNote,
  IonSpinner,
  IonModal,
  IonFooter,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  toastController,
  loadingController
} from '@ionic/vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import { useSignalements } from '@/composables/useSignalements'
import { useProblemes } from '@/composables/useProblemes'
import { useGeolocation } from '@/composables/useGeolocation'
import { useCamera } from '@/composables/useCamera'
import { useAuthStore } from '@/stores/auth.store'

// État réactif
const router = useRouter()
const authStore = useAuthStore()
const { signalementTypes, loadSignalementTypes, createSignalement } = useSignalements()
const { createProbleme } = useProblemes()
const { getCurrentPosition } = useGeolocation()
const { photos, takePhoto: cameraTakePhoto, selectFromGallery: cameraSelectFromGallery, removePhoto: cameraRemovePhoto, clearPhotos } = useCamera()

const currentStep = ref(1)
const showLocationPicker = ref(false)
const isGettingLocation = ref(false)
const isTakingPhoto = ref(false)
const isSelectingPhoto = ref(false)
const isSubmitting = ref(false)

// Helper: Check if current user has MANAGER role
const isManager = computed(() => {
  return authStore.user?.roles?.includes('MANAGER') || false
})

const locationMapContainer = ref(null)
const pickerMapContainer = ref(null)
let locationMap = null
let pickerMap = null
let locationMarker = null
let pickerMarker = null

const formData = ref({
  latitude: null,
  longitude: null,
  addressComplement: '',
  typeId: null,
  description: '',
  surfaceM2: null,
  budget: null,
  entrepriseConcernee: '',
  isAnonymous: false
})

const errors = ref({})

// Getters calculés
const progressPercentage = computed(() => (currentStep.value / 2) * 100)

const currentStepLabel = computed(() => {
  const labels = {
    1: 'Localisation',
    2: 'Description'
  }
  return labels[currentStep.value]
})

const canGoNext = computed(() => {
  switch (currentStep.value) {
    case 1:
      return formData.value.latitude && formData.value.longitude
    case 2:
      // Description is required, type is optional for users
      return formData.value.description && Object.keys(errors.value).length === 0
    default:
      return false
  }
})

const isFormValid = computed(() => {
  // Users: must have location and description (type is optional)
  return formData.value.latitude &&
         formData.value.longitude &&
         formData.value.description &&
         Object.keys(errors.value).length === 0
})

const photosCount = computed(() => photos.value.length)

const selectedType = computed(() => {
  return signalementTypes.value.find(t => t.id === formData.value.typeId)
})

// Méthodes
const getTypeColor = (icon_color) => {
  const colorMap = {
    'red': '#dc3545',
    'green': '#28a745',
    'blue': '#007bff',
    'yellow': '#ffc107',
    'orange': '#fd7e14',
    'purple': '#6f42c1',
    'red-white': '#dc3545'
  }
  return colorMap[icon_color] || '#6c757d'
}

const nextStep = () => {
  if (canGoNext.value && currentStep.value < 3) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const validateField = (field) => {
  const fieldErrors = {}

  if (field === 'description') {
    if (!formData.value.description || formData.value.description.trim().length < 3) {
      fieldErrors.description = 'La description doit contenir au moins 3 caractères'
    }
  }

  if (field === 'typeId') {
    if (!formData.value.typeId) {
      fieldErrors.typeId = 'Veuillez sélectionner un type'
    }
  }

  errors.value = {
    ...errors.value,
    ...fieldErrors
  }

  if (fieldErrors[field] === undefined) {
    delete errors.value[field]
  }
}

const useCurrentLocation = async () => {
  isGettingLocation.value = true

  try {
    const position = await getCurrentPosition()
    formData.value.latitude = position.coords.latitude
    formData.value.longitude = position.coords.longitude

    updateLocationMap()
    await showToast('Position définie avec succès', 'success')
  } catch (error) {
    console.error('Erreur de géolocalisation:', error)
    await showToast('Impossible d\'obtenir votre position', 'danger')
  } finally {
    isGettingLocation.value = false
  }
}

const openLocationPicker = () => {
  showLocationPicker.value = true
  setTimeout(() => {
    initPickerMap()
  }, 300)
}

const closeLocationPicker = () => {
  showLocationPicker.value = false
  if (pickerMap) {
    pickerMap.remove()
    pickerMap = null
  }
}

const confirmLocation = () => {
  if (pickerMarker) {
    const latlng = pickerMarker.getLatLng()
    formData.value.latitude = latlng.lat
    formData.value.longitude = latlng.lng

    updateLocationMap()
    closeLocationPicker()
    showToast('Emplacement confirmé', 'success')
  }
}

const updateLocationMap = () => {
  if (!locationMap) {
    initLocationMap()
  }

  if (locationMarker) {
    locationMarker.setLatLng([formData.value.latitude, formData.value.longitude])
  } else {
    locationMarker = L.marker([formData.value.latitude, formData.value.longitude]).addTo(locationMap)
  }

  locationMap.setView([formData.value.latitude, formData.value.longitude], 15)
}

const initLocationMap = () => {
  if (!locationMapContainer.value || locationMap) return

  locationMap = L.map(locationMapContainer.value).setView([18.8792, 47.5079], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(locationMap)

  if (formData.value.latitude && formData.value.longitude) {
    locationMarker = L.marker([formData.value.latitude, formData.value.longitude]).addTo(locationMap)
    locationMap.setView([formData.value.latitude, formData.value.longitude], 15)
  }
}

const initPickerMap = () => {
  if (!pickerMapContainer.value) return
  if (pickerMap) return

  pickerMap = L.map(pickerMapContainer.value).setView([18.8792, 47.5079], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(pickerMap)

  const initialLat = formData.value.latitude || 18.8792
  const initialLng = formData.value.longitude || 47.5079
  pickerMarker = L.marker([initialLat, initialLng], { draggable: true }).addTo(pickerMap)

  pickerMap.setView([initialLat, initialLng], 15)

  pickerMap.on('click', (e) => {
    pickerMarker.setLatLng(e.latlng)
  })
}

const takePhoto = async () => {
  if (photos.value.length >= 3) {
    await showToast('Vous avez atteint le maximum de 3 photos', 'warning')
    return
  }
  isTakingPhoto.value = true
  try {
    await cameraTakePhoto()
  } finally {
    isTakingPhoto.value = false
  }
}

const selectFromGallery = async () => {
  if (photos.value.length >= 3) {
    await showToast('Vous avez atteint le maximum de 3 photos', 'warning')
    return
  }
  isSelectingPhoto.value = true
  try {
    await cameraSelectFromGallery()
  } finally {
    isSelectingPhoto.value = false
  }
}

const removePhoto = (photoId) => {
  cameraRemovePhoto(photoId)
}

const submitReport = async () => {
  if (!isFormValid.value) {
    await showToast('Veuillez compléter tous les champs obligatoires', 'warning')
    return
  }

  isSubmitting.value = true

  const loading = await loadingController.create({
    message: isManager.value ? 'Création du signalement...' : 'Signalement du problème...',
    spinner: 'crescent'
  })

  try {
    await loading.present()

    if (isManager.value) {
      // Manager: Create signalement directly via Firestore
      const result = await createSignalement({
        latitude: formData.value.latitude,
        longitude: formData.value.longitude,
        typeId: formData.value.typeId,
        description: formData.value.description,
        surfaceM2: formData.value.surfaceM2,
        budget: formData.value.budget,
        entrepriseConcernee: formData.value.entrepriseConcernee,
        isAnonymous: formData.value.isAnonymous,
        photos: photos.value.map(p => ({
          dataUrl: p.dataUrl,
          id: p.id
        }))
      })

      if (result?.success || result?.id) {
        await showToast('Signalement créé avec succès !', 'success')

        // Reset form
        formData.value = {
          latitude: null,
          longitude: null,
          addressComplement: '',
          typeId: null,
          description: '',
          surfaceM2: null,
          budget: null,
          entrepriseConcernee: '',
          isAnonymous: false
        }
        errors.value = {}
        currentStep.value = 1
        clearPhotos()

        setTimeout(() => {
          router.push('/map')
        }, 1500)
      }
    } else {
      // User: Create probleme via Firestore
      const result = await createProbleme({
        latitude: formData.value.latitude,
        longitude: formData.value.longitude,
        typeId: formData.value.typeId || null,
        description: formData.value.description
      })

      if (result?.success || result?.id) {
        await showToast('Problème signalé avec succès ! Un manager va le traiter.', 'success')

        // Reset form
        formData.value = {
          latitude: null,
          longitude: null,
          addressComplement: '',
          typeId: null,
          description: '',
          surfaceM2: null,
          budget: null,
          entrepriseConcernee: '',
          isAnonymous: false
        }
        errors.value = {}
        currentStep.value = 1
        clearPhotos()

        setTimeout(() => {
          router.push('/map')
        }, 1500)
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi:', error)
    await showToast(error.message || 'Erreur lors de l\'envoi', 'danger')
  } finally {
    isSubmitting.value = false
    await loading.dismiss()
  }
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
  try {
    await loadSignalementTypes()
  } catch (error) {
    console.error('Erreur au chargement des types:', error)
    await showToast('Erreur lors du chargement des types', 'danger')
  }
  initLocationMap()
})

onUnmounted(() => {
  if (locationMap) {
    locationMap.remove()
    locationMap = null
  }
  if (pickerMap) {
    pickerMap.remove()
    pickerMap = null
  }
})
</script>

<style scoped>
/* 🎨 Theme adaptatif - Mode clair par défaut, sombre au toggle */
.form-content {
  --padding: 0;
  --margin: 0;
  --background: var(--app-background);
}

.step-container {
  padding: 20px;
}

.step-header {
  margin-bottom: 24px;
  text-align: center;
}

.step-header h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--ion-color-primary);
}

.step-header p {
  font-size: 14px;
  color: #b3b3b3;
  margin: 0;
}

.location-map,
.picker-map {
  height: 250px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.progress-toolbar {
  background: #2a2a2a;
}

.progress-container {
  padding: 12px 16px;
}

.progress-bar {
  height: 4px;
  background: var(--app-surface);
  border-radius: 2px;
  margin-bottom: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffc107 0%, #ffb300 100%);
  transition: width 0.3s ease;
}

.step-indicators {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 8px;
}

.step-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2a2a2a;
  border: 2px solid rgba(255, 193, 7, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #b3b3b3;
  font-size: 12px;
}

.step-indicator.active {
  background: #ffc107;
  color: var(--app-text-primary);
  border-color: var(--ion-color-primary);
}

.step-indicator.completed {
  background: #4caf50;
  color: var(--ion-text-color);
}

.step-label {
  font-size: 12px;
  color: #b3b3b3;
  text-align: center;
  margin: 0;
  font-weight: 600;
}

.location-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.or-divider {
  text-align: center;
  color: #666666;
  font-size: 12px;
  font-weight: 600;
  position: relative;
  margin: 8px 0;
}

.address-section {
  margin-top: 20px;
}

.address-item {
  margin-bottom: 12px;
}

.coordinates-info {
  padding: 12px;
  background: #2a2a2a;
  border: 1px solid rgba(255, 193, 7, 0.2);
  border-radius: 8px;
  font-size: 12px;
  color: #b3b3b3;
  margin-top: 12px;
}

.coordinates-info p {
  margin: 4px 0;
}

.type-selection {
  margin-bottom: 20px;
}

.type-selection ion-item {
  margin-bottom: 8px;
  --background: #2a2a2a;
}

.selected-type-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #2a2a2a;
  border: 2px solid rgba(255, 193, 7, 0.2);
  border-radius: 12px;
  margin-top: 20px;
}

.type-icon {
  width: 60px;
  height: 60px;
  border: 2px solid #ffc107;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
  color: var(--ion-color-primary);
}

.type-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--ion-color-primary);
}

.type-info p {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #b3b3b3;
}

.form-item {
  margin-bottom: 16px;
  --background: #2a2a2a;
  border: 1px solid rgba(255, 193, 7, 0.2);
  border-radius: 8px;
}

.photos-section {
  margin: 20px 0;
}

.photos-section h3 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--ion-color-primary);
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.photo-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 3px 12px rgba(255, 193, 7, 0.2);
  border: 2px solid rgba(255, 193, 7, 0.2);
}

.photo-thumbnail {
  width: 100%;
  height: 130px;
  object-fit: cover;
}

.remove-photo {
  position: absolute;
  top: 6px;
  right: 6px;
  --background: #ff6b6b;
  --border-radius: 12px;
  min-height: 36px;
  min-width: 36px;
}

.photo-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.photo-button {
  --background: #ffc107;
  --color: var(--app-text-primary);
  --border-radius: 12px;
  min-height: 52px;
  font-weight: 700;
}

.options-section {
  margin: 22px 0;
}

.option-item {
  --padding-start: 0;
  --padding-end: 0;
  margin-bottom: 14px;
  --background: #2a2a2a;
}

.picker-actions {
  padding: 20px;
  gap: 14px;
}

.next-button,
.submit-button {
  --border-radius: 12px;
  min-height: 56px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.submit-button {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  box-shadow: 0 4px 16px rgba(56, 161, 105, 0.35);
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: #edf2f7;
  border-left: 4px solid #667eea;
  border-radius: 8px;
  margin-top: 16px;
  color: #2d3748;
  font-size: 14px;
}

.info-box ion-icon {
  min-width: 20px;
  margin-top: 2px;
  color: #667eea;
}

.info-box p {
  margin: 0;
  line-height: 1.5;
}

ion-footer ion-toolbar {
  padding: 10px 16px;
}

@media (max-width: 480px) {
  .step-container {
    padding: 14px;
  }

  .location-map,
  .picker-map {
    height: 210px;
  }

  .photos-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .photo-thumbnail {
    height: 120px;
  }
}
</style>
