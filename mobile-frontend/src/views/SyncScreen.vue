<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button router-link="/profile">
            <ion-icon name="arrow-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>
          <span class="app-logo">ROAD ALERT</span>
          <span class="title-sep">•</span>
          <span class="app-title">Synchronisation</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="sync-content">
      <!-- État de connexion -->
      <div class="connection-status">
        <div class="status-card" :class="{ online: isOnline, offline: !isOnline }">
          <div class="status-icon">
            <ion-icon :name="isOnline ? 'wifi' : 'cloud-offline'" size="large"></ion-icon>
          </div>
          <div class="status-info">
            <h3>{{ isOnline ? 'Connecté' : 'Hors ligne' }}</h3>
            <p>{{ isOnline ? 'Synchronisation disponible' : 'Mode hors ligne activé' }}</p>
          </div>
        </div>
      </div>

      <!-- Statistiques de synchronisation -->
      <div class="sync-stats">
        <ion-grid class="stats-grid">
          <ion-row>
            <ion-col size="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <ion-icon name="cloud-upload" color="primary"></ion-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ pendingSyncCount }}</div>
                  <div class="stat-label">En attente</div>
                </div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <ion-icon name="checkmark-circle" color="success"></ion-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ lastSyncCount }}</div>
                  <div class="stat-label">Synchronisés</div>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>

      <!-- File d'attente de synchronisation -->
      <div class="sync-queue">
        <div class="section-header">
          <h3>File d'attente</h3>
          <span class="queue-count">{{ pendingSyncCount }} élément{{ pendingSyncCount > 1 ? 's' : '' }}</span>
        </div>

        <div v-if="pendingSyncCount === 0" class="empty-queue">
          <ion-icon name="checkmark-circle-outline" size="large" color="success"></ion-icon>
          <p>Tout est synchronisé !</p>
        </div>

        <ion-list v-else class="queue-list">
          <ion-item-group>
            <ion-item-divider>
              <ion-label>Actions en attente de synchronisation</ion-label>
            </ion-item-divider>

            <ion-item-sliding v-for="action in offlineQueue.slice(0, 5)" :key="action.id">
              <ion-item class="queue-item">
                <ion-icon
                  :name="getActionIcon(action.action)"
                  slot="start"
                  :color="getActionColor(action.action)"
                ></ion-icon>
                <ion-label>
                  <h3>{{ getActionTitle(action.action) }}</h3>
                  <p>{{ formatActionTimestamp(action.timestamp) }}</p>
                </ion-label>
                <ion-badge
                  v-if="action.retryCount > 0"
                  color="warning"
                  slot="end"
                >
                  {{ action.retryCount }}
                </ion-badge>
              </ion-item>

              <ion-item-options side="end">
                <ion-item-option
                  color="danger"
                  @click="removeFromQueue(action.id)"
                  expandable
                >
                  <ion-icon name="trash" slot="icon-only"></ion-icon>
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-item-group>
        </ion-list>

        <div v-if="pendingSyncCount > 5" class="queue-more">
          <p>Et {{ pendingSyncCount - 5 }} autres éléments...</p>
        </div>
      </div>

      <!-- Dernière synchronisation -->
      <div class="last-sync">
        <div class="section-header">
          <h3>Dernière synchronisation</h3>
        </div>

        <div class="sync-info">
          <div class="sync-item">
            <ion-icon name="time" slot="start" color="medium"></ion-icon>
            <div class="sync-details">
              <span class="sync-label">Dernière synchro</span>
              <span class="sync-value">{{ lastSyncText }}</span>
            </div>
          </div>

          <div class="sync-item">
            <ion-icon name="server" slot="start" color="medium"></ion-icon>
            <div class="sync-details">
              <span class="sync-label">État</span>
              <span class="sync-value" :class="{ 'sync-success': lastSyncSuccess, 'sync-error': !lastSyncSuccess }">
                {{ lastSyncSuccess ? 'Réussie' : 'Échouée' }}
              </span>
            </div>
          </div>

          <div class="sync-item">
            <ion-icon name="document" slot="start" color="medium"></ion-icon>
            <div class="sync-details">
              <span class="sync-label">Éléments synchronisés</span>
              <span class="sync-value">{{ lastSyncCount }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions de synchronisation -->
      <div class="sync-actions">
        <ion-button
          expand="block"
          :disabled="!isOnline || isSyncing || pendingSyncCount === 0"
          @click="syncNow"
          class="sync-button"
          :class="{ 'syncing': isSyncing }"
        >
          <ion-spinner v-if="isSyncing" slot="start" name="crescent"></ion-spinner>
          <ion-icon v-else name="sync" slot="start"></ion-icon>
          <span v-if="isSyncing">Synchronisation...</span>
          <span v-else>Synchroniser maintenant</span>
        </ion-button>

        <div class="secondary-actions">
          <ion-button
            fill="outline"
            @click="clearQueue"
            :disabled="pendingSyncCount === 0"
            class="secondary-button"
          >
            <ion-icon name="trash" slot="start"></ion-icon>
            Vider la file
          </ion-button>

          <ion-button
            fill="outline"
            @click="forceSync"
            :disabled="!isOnline || isSyncing"
            class="secondary-button"
          >
            <ion-icon name="refresh" slot="start"></ion-icon>
            Forcer la synchro
          </ion-button>
        </div>
      </div>

      <!-- Informations système -->
      <div class="system-info">
        <div class="section-header">
          <h3>Informations système</h3>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Version de l'app</span>
            <span class="info-value">1.0.0</span>
          </div>
          <div class="info-item">
            <span class="info-label">Stockage utilisé</span>
            <span class="info-value">{{ storageStats.appSize }}KB</span>
          </div>
          <div class="info-item">
            <span class="info-label">Signalements locaux</span>
            <span class="info-value">{{ reportsCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Dernière sauvegarde</span>
            <span class="info-value">{{ lastBackupText }}</span>
          </div>
        </div>
      </div>

      <!-- Indicateur de progression de synchro -->
      <div v-if="syncProgress > 0" class="sync-progress">
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${syncProgress}%` }"></div>
          </div>
          <span class="progress-text">{{ syncProgress }}% terminé</span>
        </div>
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
  IonButtons,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItemGroup,
  IonItemDivider,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonBadge,
  IonSpinner,
  alertController,
  toastController
} from '@ionic/vue'
import { ref, computed, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports.store'
import { useOfflineStorage } from '@/composables/useOfflineStorage'
import { storageService } from '@/services/storage.service'

// État réactif
const reportsStore = useReportsStore()
const { isOnline, offlineQueue, pendingSyncCount, syncOfflineData } = useOfflineStorage()

const isSyncing = ref(false)
const syncProgress = ref(0)
const lastSyncCount = ref(0)
const lastSyncSuccess = ref(true)

// Getters calculés
const reportsCount = computed(() => reportsStore.reports.length)

const lastSyncText = computed(() => {
  const settings = storageService.getAppSettings()
  if (!settings.lastSync) return 'Jamais'

  const date = new Date(settings.lastSync)
  const now = new Date()
  const diffHours = Math.floor((now - date) / (1000 * 60 * 60))

  if (diffHours < 1) return 'Il y a moins d\'une heure'
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`

  const diffDays = Math.floor(diffHours / 24)
  return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
})

const lastBackupText = computed(() => {
  // Simulation : dernière sauvegarde il y a 2 jours
  return 'Il y a 2 jours'
})

const storageStats = computed(() => storageService.getStorageStats())

// Méthodes
const getActionIcon = (action) => {
  const icons = {
    CREATE_REPORT: 'add-circle',
    UPDATE_REPORT: 'pencil',
    UPLOAD_PHOTO: 'camera',
    DELETE_REPORT: 'trash'
  }
  return icons[action] || 'document'
}

const getActionColor = (action) => {
  const colors = {
    CREATE_REPORT: 'success',
    UPDATE_REPORT: 'warning',
    UPLOAD_PHOTO: 'tertiary',
    DELETE_REPORT: 'danger'
  }
  return colors[action] || 'primary'
}

const getActionTitle = (action) => {
  const titles = {
    CREATE_REPORT: 'Créer un signalement',
    UPDATE_REPORT: 'Mettre à jour un signalement',
    UPLOAD_PHOTO: 'Télécharger une photo',
    DELETE_REPORT: 'Supprimer un signalement'
  }
  return titles[action] || action
}

const formatActionTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const syncNow = async () => {
  if (!isOnline.value || isSyncing.value || pendingSyncCount.value === 0) return

  isSyncing.value = true
  syncProgress.value = 0

  try {
    // Simulation de progression
    const progressInterval = setInterval(() => {
      syncProgress.value += Math.random() * 15
      if (syncProgress.value >= 90) {
        clearInterval(progressInterval)
      }
    }, 200)

    const result = await syncOfflineData()

    clearInterval(progressInterval)
    syncProgress.value = 100

    // Délai pour montrer la completion
    await new Promise(resolve => setTimeout(resolve, 500))

    if (result.success) {
      lastSyncCount.value = result.synced
      lastSyncSuccess.value = true

      await showToast(`${result.synced} éléments synchronisés`, 'success')
    } else {
      lastSyncSuccess.value = false
      await showToast('Erreur de synchronisation', 'danger')
    }

  } catch (error) {
    console.error('Erreur de synchronisation:', error)
    lastSyncSuccess.value = false
    await showToast('Erreur de synchronisation', 'danger')
  } finally {
    isSyncing.value = false
    syncProgress.value = 0
  }
}

const forceSync = async () => {
  // Force la re-synchronisation de toutes les données
  const alert = await alertController.create({
    header: 'Forcer la synchronisation',
    message: 'Cela va re-synchroniser toutes les données. Cette action peut prendre du temps.',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Confirmer',
        role: 'destructive',
        handler: async () => {
          await syncNow()
        }
      }
    ]
  })

  await alert.present()
}

const removeFromQueue = async (actionId) => {
  // Simulation de suppression de la file
  const index = offlineQueue.value.findIndex(action => action.id === actionId)
  if (index > -1) {
    offlineQueue.value.splice(index, 1)
    await showToast('Action supprimée de la file', 'success')
  }
}

const clearQueue = async () => {
  const alert = await alertController.create({
    header: 'Vider la file d\'attente',
    message: 'Toutes les actions en attente seront supprimées. Cette action est irréversible.',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Vider',
        role: 'destructive',
        handler: async () => {
          // Simulation de vidage de la file
          offlineQueue.value.splice(0)
          await showToast('File d\'attente vidée', 'success')
        }
      }
    ]
  })

  await alert.present()
}

const showToast = async (message, color = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: 'top'
  })
  await toast.present()
}

// Cycle de vie
onMounted(async () => {
  // Charger les données
  await reportsStore.fetchReports()
})
</script>

<style scoped>
/* 🎨 Theme adaptatif - Mode clair par défaut, sombre au toggle */
.sync-content {
  --background: var(--app-background);
}

.connection-status {
  padding: 16px;
}

.status-card {
  background: #2a2a2a;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.1);
  border-left: 4px solid #ffc107;
}

.status-card.online {
  border-left: 4px solid #4caf50;
}

.status-card.offline {
  border-left: 4px solid #ff9800;
}

.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 193, 7, 0.2);
}

.status-card.online .status-icon {
  background: rgba(76, 175, 80, 0.2);
}

.status-card.offline .status-icon {
  background: rgba(255, 152, 0, 0.2);
}

.status-info h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--ion-color-primary);
}

.status-info p {
  margin: 0;
  font-size: 14px;
  color: #b3b3b3;
}

.sync-stats {
  padding: 0 16px 16px 16px;
}

.stats-grid {
  --ion-grid-padding: 0;
  --ion-grid-column-padding: 4px;
}

.stat-card {
  background: #2a2a2a;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.1);
  border-left: 4px solid #ffc107;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 193, 7, 0.2);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: var(--ion-color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #b3b3b3;
  text-transform: uppercase;
  font-weight: 500;
  margin-top: 2px;
}

.sync-queue,
.last-sync,
.system-info {
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 193, 7, 0.2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 193, 7, 0.2);
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--ion-color-primary);
}

.queue-count {
  font-size: 14px;
  color: #b3b3b3;
}

.empty-queue {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-queue p {
  color: #b3b3b3;
  margin: 8px 0 0 0;
}

.queue-list {
  --ion-item-background: transparent;
  background: transparent;
}

.queue-item {
  --border-radius: 8px;
  margin: 4px 16px;
  --background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.queue-more {
  padding: 16px;
  text-align: center;
}

.queue-more p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 14px;
}

.sync-info {
  padding: 16px;
}

.sync-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.sync-item:last-child {
  margin-bottom: 0;
}

.sync-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sync-label {
  font-size: 14px;
  color: var(--ion-color-medium);
  margin-bottom: 2px;
}

.sync-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--ion-color-dark);
}

.sync-success {
  color: var(--ion-color-success);
}

.sync-error {
  color: var(--ion-color-danger);
}

.sync-actions {
  padding: 16px;
}

.sync-button {
  --border-radius: var(--button-border-radius);
  height: 48px;
  font-weight: 600;
  margin-bottom: 16px;
}

.sync-button:disabled {
  opacity: 0.5;
}

.syncing {
  --background: var(--ion-color-warning);
}

.secondary-actions {
  display: flex;
  gap: 12px;
}

.secondary-button {
  flex: 1;
  --border-radius: var(--button-border-radius);
}

.system-info {
  border-bottom: none;
}

.info-grid {
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 12px;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.4px;
}

.info-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.sync-progress {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 18px 16px;
  border-top: 1px solid var(--ion-color-light);
  box-shadow: 0 -3px 12px rgba(0, 0, 0, 0.12);
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 14px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background-color: var(--ion-color-light);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ion-color-primary), var(--ion-color-secondary));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--ion-color-primary);
  min-width: 86px;
  text-align: right;
}

/* Responsive */
@media (max-width: 480px) {
  .status-card {
    padding: 14px;
    gap: 10px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  }

  .status-icon {
    width: 44px;
    height: 44px;
  }

  .stat-card {
    padding: 14px;
    gap: 10px;
  }

  .stat-number {
    font-size: 18px;
  }

  .secondary-actions {
    flex-direction: column;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .sync-progress {
    padding: 16px 14px 18px;
  }
}
</style>
