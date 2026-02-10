<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end" v-if="notifications.length > 0">
          <ion-button @click="handleMarkAllRead" color="primary">
            <ion-icon :icon="checkmarkDoneOutline"></ion-icon>
          </ion-button>
          <ion-button @click="handleClearAll" color="danger">
            <ion-icon :icon="trashOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Badge de comptage -->
      <div v-if="unreadCount() > 0" class="unread-badge">
        {{ unreadCount() }} non {{ unreadCount() > 1 ? 'lues' : 'lue' }}
      </div>

      <!-- Liste des notifications -->
      <ion-list v-if="notifications.length > 0">
        <ion-item-sliding v-for="notif in notifications" :key="notif.id">
          <ion-item 
            @click="handleNotificationClick(notif)"
            :class="{ 'notification-unread': !notif.read }"
            button
          >
            <div class="notification-content">
              <div class="notification-header">
                <h3>{{ notif.title }}</h3>
                <span class="notification-time">{{ formatTime(notif.timestamp) }}</span>
              </div>
              <p class="notification-message">{{ notif.message }}</p>
              <div v-if="notif.newStatus" class="status-badge-container">
                <span :class="['status-badge', getStatusClass(notif.newStatus)]">
                  {{ getStatusLabel(notif.newStatus) }}
                </span>
              </div>
            </div>
            <ion-icon 
              v-if="!notif.read" 
              :icon="ellipseOutline" 
              slot="end" 
              color="primary"
              class="unread-indicator"
            ></ion-icon>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option color="primary" @click="handleMarkAsRead(notif)">
              <ion-icon :icon="checkmarkOutline"></ion-icon>
              Lire
            </ion-item-option>
            <ion-item-option color="danger" @click="handleDelete(notif)">
              <ion-icon :icon="trashOutline"></ion-icon>
              Supprimer
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <!-- État vide -->
      <div v-else class="empty-state">
        <ion-icon :icon="notificationsOffOutline" class="empty-icon"></ion-icon>
        <h2>Aucune notification</h2>
        <p>Vous serez notifié ici quand un manager mettra à jour vos signalements</p>
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
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonButton,
  IonButtons,
  IonBackButton,
  toastController,
  alertController
} from '@ionic/vue'
import {
  notificationsOffOutline,
  checkmarkOutline,
  checkmarkDoneOutline,
  trashOutline,
  ellipseOutline
} from 'ionicons/icons'
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSignalementNotifications } from '@/composables/useSignalementNotifications'

const router = useRouter()

const {
  notifications,
  startListening,
  stopListening,
  loadNotificationsFromStorage,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  unreadCount
} = useSignalementNotifications()

onMounted(() => {
  // Charger les notifications depuis le storage
  loadNotificationsFromStorage()
  
  // Démarrer l'écoute en temps réel
  startListening()
})

onUnmounted(() => {
  stopListening()
})

// Gérer le clic sur une notification
const handleNotificationClick = (notif) => {
  // Marquer comme lue
  markAsRead(notif.id)

  // Naviguer vers le signalement
  if (notif.signalementId) {
    router.push({
      name: 'Dashboard',
      query: { signalementId: notif.signalementId }
    })
  }
}

// Marquer une notification comme lue
const handleMarkAsRead = (notif) => {
  markAsRead(notif.id)
  showToast('Notification marquée comme lue', 'success')
}

// Marquer toutes comme lues
const handleMarkAllRead = async () => {
  markAllAsRead()
  await showToast('Toutes les notifications marquées comme lues', 'success')
}

// Supprimer une notification
const handleDelete = async (notif) => {
  const alert = await alertController.create({
    header: 'Supprimer',
    message: 'Voulez-vous vraiment supprimer cette notification ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: () => {
          deleteNotification(notif.id)
          showToast('Notification supprimée', 'success')
        }
      }
    ]
  })

  await alert.present()
}

// Supprimer toutes les notifications
const handleClearAll = async () => {
  const alert = await alertController.create({
    header: 'Tout supprimer',
    message: 'Voulez-vous vraiment supprimer toutes les notifications ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Tout supprimer',
        role: 'destructive',
        handler: () => {
          clearAllNotifications()
          showToast('Toutes les notifications supprimées', 'success')
        }
      }
    ]
  })

  await alert.present()
}

// Formater l'heure
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // Moins d'une minute
  if (diff < 60000) {
    return 'À l\'instant'
  }

  // Moins d'une heure
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `Il y a ${minutes} min`
  }

  // Moins d'un jour
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `Il y a ${hours}h`
  }

  // Plus d'un jour
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Obtenir la classe CSS pour le statut
const getStatusClass = (status) => {
  const classes = {
    'nouveau': 'status-new',
    'en_cours': 'status-progress',
    'termine': 'status-completed',
    'resolu': 'status-completed',
    'rejete': 'status-rejected'
  }
  return classes[status] || 'status-default'
}

// Obtenir le label du statut
const getStatusLabel = (status) => {
  const labels = {
    'nouveau': 'Nouveau',
    'en_cours': 'En cours',
    'termine': 'Terminé',
    'resolu': 'Résolu',
    'rejete': 'Rejeté'
  }
  return labels[status] || status
}

// Afficher un toast
const showToast = async (message, color = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: 'bottom'
  })
  await toast.present()
}
</script>

<style scoped>
.unread-badge {
  background: var(--color-primary);
  color: var(--color-dark);
  padding: 8px 16px;
  margin: 16px;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
}

.notification-content {
  width: 100%;
  padding: 12px 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.notification-time {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.notification-message {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.notification-unread {
  background: rgba(255, 193, 7, 0.1);
  border-left: 3px solid var(--color-primary);
}

.unread-indicator {
  font-size: 12px;
}

.status-badge-container {
  margin-top: 8px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-new {
  background: rgba(72, 187, 120, 0.2);
  color: #48bb78;
}

.status-progress {
  background: rgba(237, 137, 54, 0.2);
  color: #ed8936;
}

.status-completed {
  background: rgba(49, 130, 206, 0.2);
  color: #3182ce;
}

.status-rejected {
  background: rgba(255, 59, 48, 0.2);
  color: #ff3b30;
}

.status-default {
  background: rgba(113, 128, 150, 0.2);
  color: #718096;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  min-height: 50vh;
}

.empty-icon {
  font-size: 80px;
  color: var(--color-text-tertiary);
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h2 {
  color: var(--color-text);
  font-size: 20px;
  margin: 0 0 12px 0;
}

.empty-state p {
  color: var(--color-text-secondary);
  font-size: 14px;
  max-width: 300px;
  line-height: 1.5;
}
</style>
