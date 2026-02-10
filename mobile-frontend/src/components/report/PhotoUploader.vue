<template>
  <div class="photo-uploader">
    <div class="uploader-header">
      <h3>{{ title }}</h3>
      <span class="photo-count">({{ photos.length }}/3)</span>
    </div>

    <!-- Grille des photos -->
    <div class="photos-grid">
      <!-- Photos existantes -->
      <div
        v-for="(photo, index) in photos"
        :key="photo.id"
        class="photo-item"
      >
        <img :src="photo.dataUrl" :alt="`Photo ${index + 1}`" class="photo-image" />
        <ion-button
          fill="clear"
          size="small"
          color="danger"
          @click="removePhoto(photo.id)"
          class="remove-button"
        >
          <ion-icon name="close-circle"></ion-icon>
        </ion-button>
        <div class="photo-overlay">
          <ion-button
            fill="clear"
            size="small"
            color="light"
            @click="viewPhoto(photo)"
            class="view-button"
          >
            <ion-icon name="eye"></ion-icon>
          </ion-button>
        </div>
      </div>

      <!-- Bouton d'ajout (si moins de 3 photos) -->
      <div
        v-if="photos.length < maxPhotos"
        class="add-photo-item"
        @click="showOptions"
      >
        <div class="add-icon">
          <ion-icon name="add" size="large" color="medium"></ion-icon>
        </div>
        <span class="add-text">Ajouter</span>
      </div>
    </div>

    <!-- Boutons d'action rapide -->
    <div v-if="photos.length < maxPhotos" class="quick-actions">
      <ion-button
        fill="outline"
        size="small"
        @click="takePhoto"
        :disabled="isTakingPhoto"
        class="action-button"
      >
        <ion-spinner v-if="isTakingPhoto" slot="start" name="crescent"></ion-spinner>
        <ion-icon v-else name="camera" slot="start"></ion-icon>
        Photo
      </ion-button>

      <ion-button
        fill="outline"
        size="small"
        @click="selectFromGallery"
        :disabled="isSelectingPhoto"
        class="action-button"
      >
        <ion-spinner v-if="isSelectingPhoto" slot="start" name="crescent"></ion-spinner>
        <ion-icon v-else name="images" slot="start"></ion-icon>
        Galerie
      </ion-button>
    </div>

    <!-- Modal de visualisation des photos -->
    <ion-modal
      :is-open="showPhotoViewer"
      @did-dismiss="closePhotoViewer"
      class="photo-viewer-modal"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Photo {{ currentPhotoIndex + 1 }} / {{ photos.length }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closePhotoViewer">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content v-if="currentPhoto">
        <div class="photo-viewer">
          <img :src="currentPhoto.dataUrl" :alt="`Photo ${currentPhotoIndex + 1}`" class="viewer-image" />

          <!-- Informations de la photo -->
          <div class="photo-info">
            <div class="photo-meta">
              <span class="photo-date">
                <ion-icon name="calendar" size="small"></ion-icon>
                {{ formatPhotoDate(currentPhoto.timestamp) }}
              </span>
              <span class="photo-source">
                <ion-icon :name="currentPhoto.isFromGallery ? 'images' : 'camera'" size="small"></ion-icon>
                {{ currentPhoto.isFromGallery ? 'Galerie' : 'Appareil photo' }}
              </span>
            </div>
          </div>

          <!-- Navigation -->
          <div class="viewer-navigation">
            <ion-button
              fill="clear"
              :disabled="currentPhotoIndex === 0"
              @click="previousPhoto"
              class="nav-button"
            >
              <ion-icon name="chevron-back" size="large"></ion-icon>
            </ion-button>

            <ion-button
              fill="clear"
              :disabled="currentPhotoIndex === photos.length - 1"
              @click="nextPhoto"
              class="nav-button"
            >
              <ion-icon name="chevron-forward" size="large"></ion-icon>
            </ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Action Sheet pour les options -->
    <ion-action-sheet
      :is-open="showActionSheet"
      :buttons="actionSheetButtons"
      @did-dismiss="showActionSheet = false"
      header="Ajouter une photo"
    ></ion-action-sheet>
  </div>
</template>

<script setup>
import {
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonActionSheet,
  IonSpinner
} from '@ionic/vue'
import { ref, computed, watch } from 'vue'
import { useCamera } from '@/composables/useCamera'

// Props
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: 'Photos'
  },
  maxPhotos: {
    type: Number,
    default: 3
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'photo-added', 'photo-removed'])

// État réactif
const { takePhoto: cameraTakePhoto, selectFromGallery: cameraSelectFromGallery, removePhoto: cameraRemovePhoto } = useCamera()

const photos = ref([...props.modelValue])
const showPhotoViewer = ref(false)
const currentPhoto = ref(null)
const currentPhotoIndex = ref(0)
const showActionSheet = ref(false)
const isTakingPhoto = ref(false)
const isSelectingPhoto = ref(false)

// Boutons de l'action sheet
const actionSheetButtons = [
  {
    text: 'Prendre une photo',
    icon: 'camera',
    handler: () => {
      takePhoto()
    }
  },
  {
    text: 'Choisir depuis la galerie',
    icon: 'images',
    handler: () => {
      selectFromGallery()
    }
  },
  {
    text: 'Annuler',
    icon: 'close',
    role: 'cancel'
  }
]

// Méthodes
const showOptions = () => {
  showActionSheet.value = true
}

const takePhoto = async () => {
  isTakingPhoto.value = true
  showActionSheet.value = false

  try {
    await cameraTakePhoto()
    emit('photo-added', photos.value[photos.value.length - 1])
  } catch (error) {
    console.error('Erreur lors de la prise de photo:', error)
  } finally {
    isTakingPhoto.value = false
  }
}

const selectFromGallery = async () => {
  isSelectingPhoto.value = true
  showActionSheet.value = false

  try {
    await cameraSelectFromGallery()
    emit('photo-added', photos.value[photos.value.length - 1])
  } catch (error) {
    console.error('Erreur lors de la sélection de photo:', error)
  } finally {
    isSelectingPhoto.value = false
  }
}

const removePhoto = (photoId) => {
  cameraRemovePhoto(photoId)
  emit('photo-removed', photoId)
}

const viewPhoto = (photo) => {
  currentPhoto.value = photo
  currentPhotoIndex.value = photos.value.findIndex(p => p.id === photo.id)
  showPhotoViewer.value = true
}

const closePhotoViewer = () => {
  showPhotoViewer.value = false
  currentPhoto.value = null
  currentPhotoIndex.value = 0
}

const previousPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
    currentPhoto.value = photos.value[currentPhotoIndex.value]
  }
}

const nextPhoto = () => {
  if (currentPhotoIndex.value < photos.value.length - 1) {
    currentPhotoIndex.value++
    currentPhoto.value = photos.value[currentPhotoIndex.value]
  }
}

const formatPhotoDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Watchers
watch(() => props.modelValue, (newPhotos) => {
  photos.value = [...newPhotos]
})

watch(photos, (newPhotos) => {
  emit('update:modelValue', newPhotos)
}, { deep: true })
</script>

<style scoped>
.photo-uploader {
  margin: 20px 0;
}

.uploader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.uploader-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--ion-color-dark);
}

.photo-count {
  font-size: 14px;
  color: var(--ion-color-medium);
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: var(--ion-color-light);
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-button {
  position: absolute;
  top: -6px;
  right: -6px;
  --padding-start: 0;
  --padding-end: 0;
  width: 24px;
  height: 24px;
  --border-radius: 50%;
  z-index: 10;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
  padding: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.view-button {
  --color: white;
  --padding-start: 8px;
  --padding-end: 8px;
}

.add-photo-item {
  aspect-ratio: 1;
  border: 2px dashed var(--ion-color-light-shade);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--ion-color-light);
}

.add-photo-item:hover {
  border-color: var(--ion-color-primary);
  background: rgba(var(--ion-color-primary-rgb), 0.05);
}

.add-icon {
  margin-bottom: 4px;
}

.add-text {
  font-size: 12px;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.quick-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-button {
  --border-radius: 20px;
}

.photo-viewer-modal {
  --width: 100vw;
  --height: 100vh;
  --border-radius: 0;
}

.photo-viewer {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.viewer-image {
  width: 100%;
  height: calc(100vh - 140px);
  object-fit: contain;
  background: black;
}

.photo-info {
  padding: 16px;
  background: white;
  border-top: 1px solid var(--ion-color-light);
}

.photo-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.photo-date,
.photo-source {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.viewer-navigation {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
  pointer-events: none;
}

.nav-button {
  pointer-events: all;
  --color: white;
  --background: rgba(0, 0, 0, 0.5);
  --border-radius: 50%;
  width: 48px;
  height: 48px;
}

/* Responsive */
@media (max-width: 480px) {
  .photos-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .photo-item,
  .add-photo-item {
    aspect-ratio: 1;
  }

  .quick-actions {
    flex-direction: column;
    align-items: center;
  }

  .action-button {
    width: 120px;
  }

  .viewer-navigation {
    padding: 0 8px;
  }

  .nav-button {
    width: 40px;
    height: 40px;
  }
}
</style>
