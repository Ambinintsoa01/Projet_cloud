<template>
  <div class="stat-card" @click="$emit('click')" :class="{ clickable }">
    <div class="stat-icon">
      <slot name="icon">
        <ion-icon :name="icon" :color="iconColor"></ion-icon>
      </slot>
    </div>
    <div class="stat-content">
      <div class="stat-number">{{ value }}</div>
      <div class="stat-label">{{ label }}</div>
      <div v-if="change" class="stat-change" :class="{ positive: change > 0, negative: change < 0 }">
        <ion-icon :name="change > 0 ? 'trending-up' : 'trending-down'" size="small"></ion-icon>
        {{ Math.abs(change) }}%
      </div>
    </div>
  </div>
</template>

<script setup>
import { IonIcon } from '@ionic/vue'

// Props
const props = defineProps({
  value: {
    type: [Number, String],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'stats-chart'
  },
  iconColor: {
    type: String,
    default: 'primary'
  },
  change: {
    type: Number,
    default: null
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['click'])
</script>

<style scoped>
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-card.clickable:active {
  transform: translateY(0);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary-contrast);
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--ion-color-primary);
  line-height: 1;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  font-weight: 500;
  margin-bottom: 4px;
}

.stat-change {
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 10px;
  width: fit-content;
}

.stat-change.positive {
  color: var(--ion-color-success);
  background: rgba(34, 197, 94, 0.1);
}

.stat-change.negative {
  color: var(--ion-color-danger);
  background: rgba(239, 68, 68, 0.1);
}

/* Responsive */
@media (max-width: 480px) {
  .stat-card {
    padding: 12px;
    gap: 8px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-number {
    font-size: 20px;
  }

  .stat-label {
    font-size: 11px;
  }
}
</style>
