<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="app-logo">ROAD ALERT</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="visitor-landing-content">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-icon">
          🗺️
        </div>
        <h1 class="hero-title">Carte des Signalements</h1>
        <p class="hero-subtitle">Consultez les signalements routiers en temps réel</p>
      </div>

      <!-- Features Section -->
      <div class="features-section">
        <div class="feature-card">
          <div class="feature-icon">📍</div>
          <h3>Localisation</h3>
          <p>Consultez tous les signalements sur la carte</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📋</div>
          <h3>Tableau récapitulatif</h3>
          <p>Visualisez les détails de tous les signalements</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔄</div>
          <h3>Temps réel</h3>
          <p>Mise à jour automatique des données</p>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-number">{{ totalSignalements }}</div>
          <div class="stat-label">Signalements</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ newSignalements }}</div>
          <div class="stat-label">Nouveaux</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ inProgressSignalements }}</div>
          <div class="stat-label">En cours</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ completedSignalements }}</div>
          <div class="stat-label">Terminés</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="actions-section">
        <ion-button
          expand="block"
          color="primary"
          size="large"
          router-link="/visitor-map"
          class="action-button"
        >
          <ion-icon name="map" slot="start"></ion-icon>
          Voir la carte
        </ion-button>

        <ion-button
          expand="block"
          color="secondary"
          size="large"
          router-link="/login"
          class="action-button"
        >
          <ion-icon name="log-in" slot="start"></ion-icon>
          Se connecter
        </ion-button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-overlay">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Chargement des données...</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  toastController
} from '@ionic/vue'
import { ref, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports.store'

// État réactif
const totalSignalements = ref(0)
const newSignalements = ref(0)
const inProgressSignalements = ref(0)
const completedSignalements = ref(0)
const isLoading = ref(true)

// Charger les données
const loadStats = async () => {
  try {
    isLoading.value = true
    const reportsStore = useReportsStore()
    
    // Charger les signalements
    await reportsStore.fetchReports()
    const signalements = reportsStore.reports
    
    totalSignalements.value = signalements.length
    newSignalements.value = signalements.filter(s => (s.status || '').toLowerCase() === 'nouveau').length
    inProgressSignalements.value = signalements.filter(s => (s.status || '').toLowerCase() === 'en_cours').length
    completedSignalements.value = signalements.filter(s => (s.status || '').toLowerCase() === 'termine' || (s.status || '').toLowerCase() === 'terminé').length
    
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error)
    // Continuer même sans stats
  } finally {
    isLoading.value = false
  }
}

// Cycle de vie
onMounted(async () => {
  await loadStats()
})
</script>

<style scoped>
.visitor-landing-content {
  --background: linear-gradient(135deg, var(--app-background) 0%, var(--app-surface) 100%);
}

.hero-section {
  text-align: center;
  padding: 40px 20px;
  color: var(--ion-text-color);
}

.hero-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: var(--ion-color-primary);
}

.hero-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.features-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  padding: 20px;
  margin: 20px 0;
}

.feature-card {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: var(--ion-text-color);
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(255, 193, 7, 0.15);
  border-color: rgba(255, 193, 7, 0.5);
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.feature-card h3 {
  font-size: 16px;
  margin: 10px 0 5px 0;
  color: var(--ion-color-primary);
}

.feature-card p {
  font-size: 13px;
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  padding: 20px;
  margin: 20px 0;
}

.stat-item {
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: var(--ion-text-color);
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.actions-section {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 40px;
}

.action-button {
  --padding-start: 24px;
  --padding-end: 24px;
  height: 48px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 26, 26, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-overlay p {
  margin-top: 12px;
  color: var(--ion-color-primary);
  font-size: 14px;
}
</style>
