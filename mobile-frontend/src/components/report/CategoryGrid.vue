<template>
  <div class="category-grid">
    <div class="grid-header">
      <h3>{{ title }}</h3>
      <p>{{ subtitle }}</p>
    </div>

    <div class="categories-container" :class="{ compact }">
      <div
        v-for="category in categories"
        :key="category.key"
        class="category-card"
        :class="{ selected: selectedCategory === category.key }"
        @click="selectCategory(category.key)"
      >
        <div class="category-icon">
          {{ category.emoji }}
        </div>
        <div class="category-label">
          {{ category.label }}
        </div>
        <div v-if="selectedCategory === category.key" class="selection-indicator">
          <ion-icon name="checkmark-circle" color="primary"></ion-icon>
        </div>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-if="error" class="error-message">
      <ion-icon name="alert-circle" color="danger"></ion-icon>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup>
import {
  IonIcon
} from '@ionic/vue'
import { computed } from 'vue'
import { REPORT_CATEGORIES, REPORT_CATEGORY_EMOJIS } from '@/utils/constants'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: 'Type de problème'
  },
  subtitle: {
    type: String,
    default: 'Sélectionnez la catégorie qui correspond le mieux'
  },
  compact: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'category-selected'])

// État réactif
const selectedCategory = ref(props.modelValue)

// Données des catégories
const categories = computed(() => {
  return Object.entries(REPORT_CATEGORIES).map(([key, value]) => ({
    key: value,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    emoji: REPORT_CATEGORY_EMOJIS[value] || '📌'
  }))
})

// Méthodes
const selectCategory = (categoryKey) => {
  selectedCategory.value = categoryKey
  emit('update:modelValue', categoryKey)
  emit('category-selected', categoryKey)
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  selectedCategory.value = newValue
})
</script>

<style scoped>
.category-grid {
  padding: 0;
}

.grid-header {
  margin-bottom: 20px;
  text-align: center;
}

.grid-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--ion-color-dark);
}

.grid-header p {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.categories-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.categories-container.compact {
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 12px;
  border: 2px solid var(--ion-color-light);
  border-radius: 12px;
  background: white;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  min-height: 100px;
}

.category-card:hover {
  border-color: var(--ion-color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-card.selected {
  border-color: var(--ion-color-primary);
  background: rgba(var(--ion-color-primary-rgb), 0.05);
  box-shadow: 0 2px 8px rgba(var(--ion-color-primary-rgb), 0.2);
}

.category-icon {
  font-size: 32px;
  margin-bottom: 8px;
  transition: transform 0.2s ease;
}

.category-card.selected .category-icon {
  transform: scale(1.1);
}

.category-label {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  color: var(--ion-color-dark);
  line-height: 1.2;
  transition: color 0.2s ease;
}

.category-card.selected .category-label {
  color: var(--ion-color-primary);
  font-weight: 600;
}

.selection-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  background: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(var(--ion-color-danger-rgb), 0.1);
  border: 1px solid var(--ion-color-danger);
  border-radius: 8px;
  margin-top: 16px;
}

.error-message span {
  font-size: 14px;
  color: var(--ion-color-danger);
}

/* Animations */
.category-card {
  animation: fadeInUp 0.5s ease-out;
  animation-fill-mode: both;
}

.category-card:nth-child(1) { animation-delay: 0.1s; }
.category-card:nth-child(2) { animation-delay: 0.15s; }
.category-card:nth-child(3) { animation-delay: 0.2s; }
.category-card:nth-child(4) { animation-delay: 0.25s; }
.category-card:nth-child(5) { animation-delay: 0.3s; }
.category-card:nth-child(6) { animation-delay: 0.35s; }
.category-card:nth-child(7) { animation-delay: 0.4s; }
.category-card:nth-child(8) { animation-delay: 0.45s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .categories-container {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .categories-container.compact {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .category-card {
    padding: 16px 8px;
    min-height: 80px;
  }

  .category-icon {
    font-size: 28px;
    margin-bottom: 6px;
  }

  .category-label {
    font-size: 13px;
  }

  .grid-header h3 {
    font-size: 16px;
  }

  .grid-header p {
    font-size: 13px;
  }
}
</style>
