<template>
  <ion-item
    class="report-item"
    button
    @click="$emit('click', report)"
    :detail="showDetail"
  >
    <ion-thumbnail slot="start" class="report-thumbnail">
      <img
        v-if="report.photos && report.photos.length > 0"
        :src="report.photos[0]"
        :alt="'Photo de ' + report.title"
        class="report-image"
      />
      <div v-else class="no-image">
        <ion-icon name="image" color="medium"></ion-icon>
      </div>
    </ion-thumbnail>

    <ion-label class="report-label">
      <h2 class="report-title">{{ report.title }}</h2>
      <p class="report-address">
        <ion-icon name="location" size="small"></ion-icon>
        {{ truncateText(report.address, maxAddressLength) }}
      </p>
      <p class="report-meta">
        <ion-badge :color="statusColor" size="small">
          {{ statusLabel }}
        </ion-badge>
        <span class="report-date">{{ formattedDate }}</span>
        <span v-if="showCategory" class="report-category">
          <ion-chip size="small" :color="categoryColor">
            <ion-icon :name="categoryIcon" size="small"></ion-icon>
            <ion-label>{{ categoryLabel }}</ion-label>
          </ion-chip>
        </span>
      </p>
    </ion-label>

    <ion-icon
      v-if="showDetail"
      name="chevron-forward"
      slot="end"
      color="medium"
      class="item-chevron"
    ></ion-icon>

    <slot name="end"></slot>
  </ion-item>
</template>

<script setup>
import {
  IonItem,
  IonThumbnail,
  IonLabel,
  IonBadge,
  IonChip,
  IonIcon
} from '@ionic/vue'
import { computed } from 'vue'
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS, REPORT_CATEGORY_ICONS, REPORT_CATEGORY_LABELS } from '@/utils/constants'

// Props
const props = defineProps({
  report: {
    type: Object,
    required: true
  },
  showDetail: {
    type: Boolean,
    default: true
  },
  showCategory: {
    type: Boolean,
    default: false
  },
  maxAddressLength: {
    type: Number,
    default: 40
  },
  dateFormat: {
    type: String,
    default: 'relative' // 'relative' ou 'absolute'
  }
})

// Emits
const emit = defineEmits(['click'])

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
  return REPORT_CATEGORY_ICONS[props.report.category] || 'help-circle'
})

const categoryLabel = computed(() => {
  return REPORT_CATEGORY_LABELS[props.report.category] || props.report.category
})

const categoryColor = computed(() => {
  return 'primary'
})

const formattedDate = computed(() => {
  if (!props.report.createdAt) return ''

  const date = new Date(props.report.createdAt)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (props.dateFormat === 'absolute') {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Format relatif par défaut
  if (diffDays === 1) {
    return 'Aujourd\'hui'
  } else if (diffDays === 2) {
    return 'Hier'
  } else if (diffDays <= 7) {
    return `Il y a ${diffDays - 1} jour${diffDays - 1 > 1 ? 's' : ''}`
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }
})

// Méthodes
const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.report-item {
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  margin: 8px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --background: white;
  transition: all 0.2s ease;
}

.report-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.report-thumbnail {
  --size: 60px;
  --border-radius: 8px;
  flex-shrink: 0;
}

.report-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.report-label {
  margin-left: 12px;
  flex: 1;
  min-width: 0;
}

.report-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--ion-color-dark);
  line-height: 1.3;
  word-break: break-word;
}

.report-address {
  font-size: 14px;
  color: var(--ion-color-medium);
  margin: 0 0 6px 0;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  word-break: break-word;
}

.report-address ion-icon {
  margin-top: 1px;
  flex-shrink: 0;
}

.report-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.report-date {
  font-size: 12px;
  color: var(--ion-color-medium);
  flex-shrink: 0;
}

.report-category {
  flex-shrink: 0;
}

.item-chevron {
  opacity: 0.6;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 480px) {
  .report-item {
    margin: 6px 12px;
    --padding-start: 12px;
    --padding-end: 12px;
  }

  .report-thumbnail {
    --size: 50px;
  }

  .report-title {
    font-size: 15px;
  }

  .report-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .report-date {
    order: -1;
  }
}
</style>
