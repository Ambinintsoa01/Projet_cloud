<template>
  <ion-modal :is-open="isOpen" @did-dismiss="onDismiss">
    <ion-header>
      <ion-toolbar>
        <ion-title>Options</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onDismiss">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="options-container">
        <!-- Option Caméra -->
        <div class="option-card" @click="selectCamera">
          <div class="option-icon">
            <ion-icon name="camera" color="primary"></ion-icon>
          </div>
          <div class="option-content">
            <h3>📸 Prendre une photo</h3>
            <p>Utiliser la caméra pour prendre une photo instantanément</p>
          </div>
          <div class="option-arrow">
            <ion-icon name="chevron-forward" color="medium"></ion-icon>
          </div>
        </div>

        <!-- Option Galerie -->
        <div class="option-card" @click="selectGallery">
          <div class="option-icon">
            <ion-icon name="images" color="secondary"></ion-icon>
          </div>
          <div class="option-content">
            <h3>🖼️ Galerie de photos</h3>
            <p>Choisir une photo depuis votre galerie</p>
          </div>
          <div class="option-arrow">
            <ion-icon name="chevron-forward" color="medium"></ion-icon>
          </div>
        </div>

        <!-- Option Signalement Rapide -->
        <div class="option-card" @click="selectQuickReport">
          <div class="option-icon">
            <ion-icon name="flash" color="warning"></ion-icon>
          </div>
          <div class="option-content">
            <h3>⚡ Signalement rapide</h3>
            <p>Signaler un problème avec minimum d'informations</p>
          </div>
          <div class="option-arrow">
            <ion-icon name="chevron-forward" color="medium"></ion-icon>
          </div>
        </div>

        <!-- Option Signalement Complet -->
        <div class="option-card" @click="selectFullReport">
          <div class="option-icon">
            <ion-icon name="document-text" color="success"></ion-icon>
          </div>
          <div class="option-content">
            <h3>📝 Signalement détaillé</h3>
            <p>Formulaire complet avec toutes les options</p>
          </div>
          <div class="option-arrow">
            <ion-icon name="chevron-forward" color="medium"></ion-icon>
          </div>
        </div>

        <!-- Option Position Actuelle -->
        <div class="option-card" @click="selectCurrentLocation">
          <div class="option-icon">
            <ion-icon name="location" color="danger"></ion-icon>
          </div>
          <div class="option-content">
            <h3>📍 Ma position actuelle</h3>
            <p>Centrer la carte sur ma position GPS</p>
          </div>
          <div class="option-arrow">
            <ion-icon name="chevron-forward" color="medium"></ion-icon>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonContent 
} from '@ionic/vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['dismiss', 'select-camera', 'select-gallery', 'select-quick-report', 'select-full-report', 'select-current-location'])

const onDismiss = () => {
  emit('dismiss')
}

const selectCamera = () => {
  emit('select-camera')
  onDismiss()
}

const selectGallery = () => {
  emit('select-gallery')
  onDismiss()
}

const selectQuickReport = () => {
  emit('select-quick-report')
  onDismiss()
}

const selectFullReport = () => {
  emit('select-full-report')
  onDismiss()
}

const selectCurrentLocation = () => {
  emit('select-current-location')
  onDismiss()
}
</script>

<style scoped>
.options-container {
  padding: 20px;
}

.option-card {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  background: var(--ion-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--ion-color-light-shade);
}

.option-card:hover {
  background: var(--ion-color-light-tint);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option-card:active {
  transform: translateY(0);
}

.option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: var(--ion-color-light-tint);
  margin-right: 16px;
}

.option-icon ion-icon {
  font-size: 24px;
}

.option-content {
  flex: 1;
}

.option-content h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.option-content p {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.3;
}

.option-arrow {
  margin-left: 12px;
}

.option-arrow ion-icon {
  font-size: 20px;
}
</style>
