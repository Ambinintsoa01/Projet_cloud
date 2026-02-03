<template>
  <ion-page>
    <!-- Header -->
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>
          <span class="app-logo">ROAD ALERT</span>
          <span class="title-sep">•</span>
          <span class="app-title">Problèmes à traiter</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="problemes-content">
      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Chargement des problèmes...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="problemes.length === 0" class="empty-state">
        <ion-icon name="checkmark-circle-outline" size="large"></ion-icon>
        <h2>Aucun problème en attente</h2>
        <p>Tous les problèmes signalés ont été traités ✓</p>
      </div>

      <!-- Problemes list -->
      <div v-else class="problemes-list">
        <div v-for="probleme in problemes" :key="probleme.id" class="probleme-card">
          <!-- Card Header with user info and date -->
          <div class="card-header">
            <div class="user-info">
              <div class="avatar">
                {{ getUserInitials(probleme.userId) }}
              </div>
              <div class="user-details">
                <h3>Utilisateur #{{ probleme.userId?.substring(0, 8) || 'Anonyme' }}</h3>
                <p class="date">{{ formatDate(probleme.createdAt) }}</p>
              </div>
            </div>
            <div class="status-badge">
              <span class="badge-open">Ouvert</span>
            </div>
          </div>

          <!-- Card Body with problem details -->
          <div class="card-body">
            <!-- Location with small map -->
            <div class="location-section">
              <ion-icon name="location-outline" size="small"></ion-icon>
              <span>{{ probleme.latitude.toFixed(4) }}, {{ probleme.longitude.toFixed(4) }}</span>
            </div>

            <!-- Description -->
            <div class="description-section">
              <p class="label">Problème signalé:</p>
              <p class="description-text">{{ probleme.description }}</p>
            </div>

            <!-- Type if provided -->
            <div v-if="probleme.typeId" class="type-section">
              <p class="label">Type suggéré:</p>
              <p class="type-name">{{ getTypeName(probleme.typeId) }}</p>
            </div>
          </div>

          <!-- Card Footer with action buttons -->
          <div class="card-footer">
            <ion-button
              fill="solid"
              size="small"
              @click="openConvertModal(probleme)"
              class="convert-button"
            >
              <ion-icon name="checkmark-circle" slot="start"></ion-icon>
              Convertir en signalement
            </ion-button>
          </div>
        </div>
      </div>

      <!-- Pull-to-refresh -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
    </ion-content>

    <!-- Convert Modal -->
    <ion-modal
      :is-open="showConvertModal"
      @did-dismiss="closeConvertModal"
      :initial-break-point="0.75"
      :break-points="[0, 0.75, 1]"
      class="convert-modal"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>
            <span class="app-logo">ROAD ALERT</span>
            <span class="title-sep">•</span>
            <span class="app-title">Convertir le problème</span>
          </ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeConvertModal">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content v-if="selectedProbleme" class="modal-content">
        <!-- Problem summary -->
        <div class="summary-section">
          <h3>{{ selectedProbleme.description }}</h3>
          <p class="location-text">
            <ion-icon name="location" size="small"></ion-icon>
            {{ selectedProbleme.latitude.toFixed(4) }}, {{ selectedProbleme.longitude.toFixed(4) }}
          </p>
        </div>

        <!-- Conversion form -->
        <div class="form-section">
          <!-- Type selection (required) -->
          <ion-item class="form-item">
            <ion-label position="floating">Type de signalement *</ion-label>
            <ion-select
              v-model="conversionData.typeId"
              placeholder="Sélectionner un type"
              @ionChange="validateField('typeId')"
            >
              <ion-select-option
                v-for="type in signalementTypes"
                :key="type.id"
                :value="type.id"
              >
                {{ type.libelle }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-note v-if="errors.typeId" class="error-note">
            {{ errors.typeId }}
          </ion-note>

          <!-- Description (required, can be updated) -->
          <ion-item class="form-item">
            <ion-label position="floating">Description complète *</ion-label>
            <ion-textarea
              v-model="conversionData.description"
              placeholder="Entrez une description détaillée"
              rows="3"
              @ionBlur="validateField('description')"
            ></ion-textarea>
          </ion-item>
          <ion-note v-if="errors.description" class="error-note">
            {{ errors.description }}
          </ion-note>
          <ion-note class="char-count">
            {{ conversionData.description?.length || 0 }}/500
          </ion-note>

          <!-- Surface (optional) -->
          <ion-item class="form-item">
            <ion-label position="floating">Surface (m²)</ion-label>
            <ion-input
              v-model.number="conversionData.surfaceM2"
              type="number"
              placeholder="Ex: 150"
              min="0"
              step="0.01"
            ></ion-input>
          </ion-item>

          <!-- Budget (optional) -->
          <ion-item class="form-item">
            <ion-label position="floating">Budget estimé (Ariary)</ion-label>
            <ion-input
              v-model.number="conversionData.budget"
              type="number"
              placeholder="Ex: 50000"
              min="0"
              step="1000"
            ></ion-input>
          </ion-item>
        </div>

        <!-- Action buttons -->
        <div class="button-group">
          <ion-button
            fill="clear"
            @click="closeConvertModal"
            :disabled="isConverting"
          >
            Annuler
          </ion-button>
          <ion-button
            fill="solid"
            color="success"
            @click="submitConversion"
            :disabled="!isConversionValid || isConverting"
            class="submit-button"
          >
            <ion-spinner v-if="isConverting" slot="start" name="crescent"></ion-spinner>
            <ion-icon v-else name="checkmark-circle" slot="start"></ion-icon>
            Convertir
          </ion-button>
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
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonNote,
  IonSpinner,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonRefresher,
  IonRefresherContent,
  IonBackButton,
  toastController,
  loadingController
} from '@ionic/vue'
import { ref, computed, onMounted } from 'vue'
import { useSignalements } from '@/composables/useSignalements'
import { useProblemes } from '@/composables/useProblemes'

// Composables & services
const { signalementTypes, loadSignalementTypes } = useSignalements()
const { listOpenProblemes, convertProbleme } = useProblemes()

// State
const problemes = ref([])
const isLoading = ref(false)
const isConverting = ref(false)
const showConvertModal = ref(false)
const selectedProbleme = ref(null)

const conversionData = ref({
  typeId: null,
  description: '',
  surfaceM2: null,
  budget: null
})

const errors = ref({})

// Computed
const isConversionValid = computed(() => {
  return conversionData.value.typeId &&
         conversionData.value.description?.trim().length >= 10 &&
         Object.keys(errors.value).length === 0
})

// Methods
const loadProblemes = async () => {
  isLoading.value = true
  try {
    const response = await listOpenProblemes()
    problemes.value = response || []
    console.log('✅ Problèmes ouverts chargés depuis Firestore:', problemes.value.length)
  } catch (error) {
    console.error('Erreur lors du chargement des problèmes:', error)
    await showToast('Erreur lors du chargement des problèmes', 'danger')
  } finally {
    isLoading.value = false
  }
}

const getUserInitials = (userId) => {
  if (!userId) return '?'
  // Utilise les premiers caractères de l'ID Firebase
  return userId.substring(0, 2).toUpperCase()
}

const formatDate = (date) => {
  if (!date) return 'Date inconnue'
  // Handle both Date objects and Firestore Timestamps
  const dateObj = date instanceof Date ? date : (date?.toDate?.() || new Date(date))
  return dateObj.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTypeName = (typeId) => {
  if (!typeId) return 'Non spécifié'
  const type = signalementTypes.value.find(t => t.id === typeId)
  return type?.libelle || typeId
}

const openConvertModal = (probleme) => {
  selectedProbleme.value = probleme
  conversionData.value = {
    typeId: probleme.typeId || null,
    description: probleme.description,
    surfaceM2: null,
    budget: null
  }
  errors.value = {}
  showConvertModal.value = true
}

const closeConvertModal = () => {
  showConvertModal.value = false
  selectedProbleme.value = null
  conversionData.value = {
    typeId: null,
    description: '',
    surfaceM2: null,
    budget: null
  }
  errors.value = {}
}

const validateField = (field) => {
  const fieldErrors = {}

  if (field === 'typeId') {
    if (!conversionData.value.typeId) {
      fieldErrors.typeId = 'Veuillez sélectionner un type'
    }
  }

  if (field === 'description') {
    if (!conversionData.value.description || conversionData.value.description.trim().length < 10) {
      fieldErrors.description = 'La description doit contenir au moins 10 caractères'
    }
    if (conversionData.value.description && conversionData.value.description.length > 500) {
      fieldErrors.description = 'La description ne doit pas dépasser 500 caractères'
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

const submitConversion = async () => {
  if (!selectedProbleme.value) return

  isConverting.value = true

  const loading = await loadingController.create({
    message: 'Conversion en cours...',
    spinner: 'crescent'
  })

  try {
    await loading.present()

    const result = await convertProbleme(selectedProbleme.value.id, {
      typeId: conversionData.value.typeId,
      description: conversionData.value.description,
      surfaceM2: conversionData.value.surfaceM2 || null,
      budget: conversionData.value.budget || null
    })

    if (result?.success || result?.id) {
      await showToast('Problème converti en signalement avec succès !', 'success')
      closeConvertModal()
      await loadProblemes() // Reload the list
    }
  } catch (error) {
    console.error('Erreur lors de la conversion:', error)
    await showToast(error.message || 'Erreur lors de la conversion', 'danger')
  } finally {
    isConverting.value = false
    await loading.dismiss()
  }
}

const handleRefresh = async (event) => {
  await loadProblemes()
  await event.detail.complete()
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

// Lifecycle
onMounted(async () => {
  try {
    await loadSignalementTypes()
  } catch (error) {
    console.error('Erreur au chargement des types:', error)
  }
  await loadProblemes()
})
</script>

<style scoped>
.problemes-content {
  --padding: 0;
  --background: var(--app-background);
}

.loading-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-state ion-icon {
  font-size: 80px;
  color: var(--ion-color-primary);
  margin-bottom: 16px;
}

.empty-state h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: #b3b3b3;
  margin: 0;
}

.problemes-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 80px;
}

.probleme-card {
  background: #2a2a2a;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 193, 7, 0.2);
  border-left: 4px solid #ffc107;
}

.card-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 193, 7, 0.15);
  background: #1f1f1f;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 193, 7, 0.2);
  color: var(--ion-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
  border: 2px solid #ffc107;
}

.user-details h3 {
  font-size: 14px;
  font-weight: 700;
  color: var(--ion-text-color);
  margin: 0;
}

.user-details p {
  font-size: 12px;
  color: #b3b3b3;
  margin: 4px 0 0 0;
}

.status-badge {
  display: flex;
  gap: 8px;
}

.badge-open {
  padding: 4px 12px;
  background: #ffc107;
  color: var(--app-text-primary);
  font-size: 12px;
  font-weight: 800;
  border-radius: 999px;
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #1a1a1a;
  border-radius: 8px;
  font-size: 12px;
  color: #b3b3b3;
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.location-section ion-icon {
  color: var(--ion-color-primary);
}

.description-section,
.type-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 12px;
  font-weight: 700;
  color: #b3b3b3;
  text-transform: uppercase;
  margin: 0;
  letter-spacing: 0.3px;
}

.description-text {
  font-size: 14px;
  color: var(--ion-text-color);
  line-height: 1.5;
  margin: 0;
}

.type-name {
  font-size: 13px;
  color: var(--ion-color-primary);
  font-weight: 700;
  margin: 0;
}

.card-footer {
  padding: 12px 16px;
  background: #1f1f1f;
  border-top: 1px solid rgba(255, 193, 7, 0.15);
  display: flex;
  gap: 8px;
}

.convert-button {
  --border-radius: 12px;
  flex: 1;
  min-height: 44px;
  font-weight: 800;
  --background: #ffc107;
  --color: var(--app-text-primary);
  box-shadow: 0 6px 16px rgba(255, 193, 7, 0.35);
}

/* Modal Styles */
.convert-modal {
  --height: auto;
}

.modal-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 80px;
}

.summary-section {
  padding: 16px;
  background: #2a2a2a;
  border-radius: 12px;
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.summary-section h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.location-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #b3b3b3;
  margin: 0;
}

.location-text ion-icon {
  color: var(--ion-color-primary);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-item {
  padding: 0;
  --padding-start: 0;
  --padding-end: 0;
  margin-bottom: 12px;
}

.form-item ion-label {
  font-size: 13px;
  font-weight: 600;
  color: #b3b3b3;
}

.form-item ion-input,
.form-item ion-textarea,
.form-item ion-select {
  font-size: 14px;
  --padding-start: 0;
  --padding-end: 0;
}

.error-note {
  color: #ff6b6b;
  font-size: 12px;
  margin-top: -8px;
  margin-bottom: 8px;
}

.char-count {
  font-size: 11px;
  color: #b3b3b3;
  text-align: right;
}

.button-group {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid rgba(255, 193, 7, 0.2);
  justify-content: flex-end;
}

.button-group ion-button {
  --border-radius: 12px;
  min-height: 44px;
  font-weight: 700;
}

.submit-button {
  --background: #ffc107;
  --color: var(--app-text-primary);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.25);
}

@media (max-width: 480px) {
  .problemes-list {
    padding: 12px;
    gap: 10px;
  }

  .user-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .button-group {
    flex-direction: column-reverse;
  }

  .button-group ion-button {
    width: 100%;
  }
}
</style>
