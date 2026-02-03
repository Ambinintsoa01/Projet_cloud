<template>
  <div class="report-popup">
    <!-- En-tête avec statut -->
    <div class="popup-header">
      <ion-badge :color="statusColor" class="status-badge">
        {{ statusLabel }}
      </ion-badge>
    </div>

    <!-- Titre -->
    <h3 class="popup-title">{{ report.title }}</h3>

    <!-- Adresse -->
    <div class="popup-address">
      <ion-icon name="location-outline" size="small"></ion-icon>
      <span>{{ report.address }}</span>
    </div>

    <!-- Catégorie -->
    <div class="popup-category">
      <ion-chip size="small" :color="categoryColor">
        <ion-icon :name="categoryIcon" size="small"></ion-icon>
        <ion-label>{{ categoryLabel }}</ion-label>
      </ion-chip>
    </div>

    <!-- Description tronquée -->
    <div class="popup-description">
      <p>{{ truncatedDescription }}</p>
      <span v-if="isTruncated" class="read-more">... voir plus</span>
    </div>

    <!-- Photos (aperçu) -->
    <div v-if="report.photos && report.photos.length > 0" class="popup-photos">
      <div class="photo-preview">
        <img :src="report.photos[0]" :alt="'Photo principale'" class="preview-image" />
        <div v-if="report.photos.length > 1" class="photo-count">
          +{{ report.photos.length - 1 }}
        </div>
      </div>
    </div>

    <!-- Date -->
    <div class="popup-date">
      <ion-icon name="calendar-outline" size="small"></ion-icon>
      <span>{{ formattedDate }}</span>
    </div>

    <!-- Actions -->
    <div class="popup-actions">
      <ion-button
        fill="clear"
        size="small"
        @click="$emit('view-details')"
        class="action-button"
      >
        <ion-icon name="information-circle-outline" slot="start"></ion-icon>
        Détails
      </ion-button>

      <ion-button
        fill="clear"
        size="small"
        @click="$emit('get-directions')"
        class="action-button"
      >
        <ion-icon name="navigate-outline" slot="start"></ion-icon>
        Itinéraire
      </ion-button>
    </div>
  </div>
</template>

<script setup>
import {
  IonBadge,
  IonChip,
  IonIcon,
  IonLabel,
  IonButton
} from '@ionic/vue'
import { computed } from 'vue'
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS, REPORT_CATEGORY_ICONS, REPORT_CATEGORY_LABELS } from '@/utils/constants'

// Props
const props = defineProps({
  report: {
    type: Object,
    required: true
  },
  maxDescriptionLength: {
    type: Number,
    default: 100
  }
})

// Emits
const emit = defineEmits(['view-details', 'get-directions'])

// Getters calculés
const statusColor = computed(() => {
  const colors = {
    new: 'danger',
    in_progress: 'warning',
    completed: 'success'
  }
  return colors[props.report.status] || 'primary'
})

const statusLabel = computed(() => {
  return REPORT_STATUS_LABELS[props.report.status] || props.report.status
})

const categoryIcon = computed(() => {
  return REPORT_CATEGORY_ICONS[props.report.category] || 'help-circle-outline'
})

const categoryLabel = computed(() => {
  return REPORT_CATEGORY_LABELS[props.report.category] || props.report.category
})

const categoryColor = computed(() => {
  return 'primary' // Couleur fixe pour les catégories
})

const truncatedDescription = computed(() => {
  if (!props.report.description) return ''

  if (props.report.description.length <= props.maxDescriptionLength) {
    return props.report.description
  }

  return props.report.description.substring(0, props.maxDescriptionLength)
})

const isTruncated = computed(() => {
  return props.report.description && props.report.description.length > props.maxDescriptionLength
})

const formattedDate = computed(() => {
  if (!props.report.createdAt) return ''

  const date = new Date(props.report.createdAt)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return 'Aujourd\'hui'
  } else if (diffDays === 2) {
    return 'Hier'
  } else if (diffDays <= 7) {
    return `Il y a ${diffDays - 1} jours`
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }
})
</script>

<style scoped>
.report-popup {
  min-width: 250px;
  max-width: 300px;
  font-family: var(--ion-font-family);
  font-size: 14px;
}

.popup-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.status-badge {
  font-size: 10px;
  padding: 2px 6px;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--ion-color-dark);
  line-height: 1.3;
}

.popup-address {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 8px;
  color: var(--ion-color-medium);
  font-size: 13px;
  line-height: 1.4;
}

.popup-address ion-icon {
  margin-top: 1px;
  flex-shrink: 0;
}

.popup-category {
  margin-bottom: 8px;
}

.popup-description {
  margin-bottom: 8px;
  color: var(--ion-color-dark-tint);
  line-height: 1.4;
}

.popup-description p {
  margin: 0;
  font-size: 13px;
}

.read-more {
  color: var(--ion-color-primary);
  font-weight: 500;
  font-size: 12px;
}

.popup-photos {
  margin-bottom: 8px;
}

.photo-preview {
  position: relative;
  width: 100%;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--ion-color-light);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-count {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.popup-date {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
  color: var(--ion-color-medium);
  font-size: 12px;
}

.popup-actions {
  display: flex;
  gap: 8px;
  border-top: 1px solid var(--ion-color-light);
  padding-top: 8px;
}

.action-button {
  flex: 1;
  --padding-start: 4px;
  --padding-end: 4px;
  --padding-top: 4px;
  --padding-bottom: 4px;
  font-size: 12px;
  min-height: 32px;
}

.action-button ion-icon {
  font-size: 14px;
}

/* Animations */
.report-popup {
  animation: popupFadeIn 0.2s ease-out;
}

@keyframes popupFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .report-popup {
    min-width: 220px;
    max-width: 280px;
  }

  .popup-title {
    font-size: 15px;
  }

  .popup-actions {
    flex-direction: column;
    gap: 4px;
  }

  .action-button {
    min-height: 36px;
  }
}
</style>
