<template>
  <div class="filter-bar">
    <ion-segment
      v-model="selectedFilter"
      @ion-change="onFilterChange"
      :scrollable="scrollable"
      class="filter-segment"
      :class="{ compact }"
    >
      <ion-segment-button
        v-for="filter in filters"
        :key="filter.key"
        :value="filter.key"
        class="filter-button"
      >
        <ion-label>{{ filter.label }}</ion-label>
        <ion-badge
          v-if="filter.count !== undefined && filter.count > 0"
          class="filter-count"
          :color="filter.color || 'primary'"
        >
          {{ filter.count }}
        </ion-badge>
      </ion-segment-button>
    </ion-segment>

    <!-- Indicateur de résultats -->
    <div v-if="showResultsCount" class="results-indicator">
      <span class="results-text">
        {{ totalResults }} résultat{{ totalResults > 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Bouton d'options supplémentaires -->
    <ion-button
      v-if="showExtraOptions"
      fill="clear"
      size="small"
      @click="$emit('extra-options')"
      class="extra-options-button"
    >
      <ion-icon name="ellipsis-vertical"></ion-icon>
    </ion-button>
  </div>
</template>

<script setup>
import {
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon
} from '@ionic/vue'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  filters: {
    type: Array,
    default: () => []
  },
  scrollable: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  },
  showResultsCount: {
    type: Boolean,
    default: false
  },
  totalResults: {
    type: Number,
    default: 0
  },
  showExtraOptions: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'filter-change', 'extra-options'])

// État réactif
const selectedFilter = ref(props.modelValue)

// Méthodes
const onFilterChange = (event) => {
  const value = event.detail.value
  selectedFilter.value = value
  emit('update:modelValue', value)
  emit('filter-change', value)
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  selectedFilter.value = newValue
})
</script>

<style scoped>
.filter-bar {
  background: var(--ion-background-color);
  border-bottom: 1px solid var(--ion-color-light);
  position: relative;
}

.filter-segment {
  --background: transparent;
  padding: 8px 16px;
}

.filter-segment.compact {
  --background: transparent;
  padding: 4px 16px;
}

.filter-button {
  --border-radius: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 8px;
  --padding-bottom: 8px;
  position: relative;
}

.filter-count {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
}

.results-indicator {
  padding: 8px 16px 12px 16px;
  border-top: 1px solid var(--ion-color-light);
  background: var(--ion-background-color);
}

.results-text {
  font-size: 14px;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.extra-options-button {
  position: absolute;
  top: 8px;
  right: 8px;
  --padding-start: 8px;
  --padding-end: 8px;
  --color: var(--ion-color-medium);
  z-index: 10;
}

/* Animations */
.filter-button {
  transition: all 0.2s ease;
}

.filter-button.segment-button-checked {
  --background: var(--ion-color-primary);
  --color: white;
}

/* Responsive */
@media (max-width: 480px) {
  .filter-segment {
    padding: 8px 12px;
  }

  .filter-segment.compact {
    padding: 4px 12px;
  }

  .filter-button {
    --padding-start: 10px;
    --padding-end: 10px;
    --padding-top: 6px;
    --padding-bottom: 6px;
    font-size: 14px;
  }

  .results-indicator {
    padding: 6px 12px 10px 12px;
  }

  .results-text {
    font-size: 13px;
  }

  .extra-options-button {
    top: 6px;
    right: 6px;
  }
}
</style>
