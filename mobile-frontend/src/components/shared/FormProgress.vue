<template>
  <div class="form-progress">
    <!-- Barre de progression -->
    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: `${progressPercentage}%` }"
      ></div>
    </div>

    <!-- Indicateurs d'étapes -->
    <div class="step-indicators">
      <div
        v-for="(step, index) in totalSteps"
        :key="index"
        class="step-indicator"
        :class="{
          active: currentStep > index,
          current: currentStep === index + 1,
          completed: currentStep > index + 1
        }"
      >
        <ion-icon
          v-if="currentStep > index + 1"
          name="checkmark"
          size="small"
        ></ion-icon>
        <span v-else>{{ index + 1 }}</span>
      </div>
    </div>

    <!-- Texte de l'étape courante -->
    <div v-if="showLabels" class="step-labels">
      <span class="current-label">{{ currentStepLabel }}</span>
      <span v-if="showStepCount" class="step-count">
        Étape {{ currentStep }} sur {{ totalSteps }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { IonIcon } from '@ionic/vue'
import { computed } from 'vue'

// Props
const props = defineProps({
  currentStep: {
    type: Number,
    required: true,
    validator: (value) => value > 0
  },
  totalSteps: {
    type: Number,
    required: true,
    validator: (value) => value > 0
  },
  currentStepLabel: {
    type: String,
    default: ''
  },
  showLabels: {
    type: Boolean,
    default: true
  },
  showStepCount: {
    type: Boolean,
    default: true
  }
})

// Getters calculés
const progressPercentage = computed(() => {
  return Math.min((props.currentStep / props.totalSteps) * 100, 100)
})
</script>

<style scoped>
.form-progress {
  margin-bottom: 24px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: var(--ion-color-light);
  border-radius: 2px;
  margin-bottom: 16px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ion-color-primary), var(--ion-color-secondary));
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-indicators {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.step-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--ion-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-medium);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.step-indicator.active {
  background-color: var(--ion-color-primary);
  color: white;
  transform: scale(1.1);
}

.step-indicator.current {
  background-color: var(--ion-color-primary);
  color: white;
  box-shadow: 0 4px 8px rgba(var(--ion-color-primary-rgb), 0.3);
}

.step-indicator.completed {
  background-color: var(--ion-color-success);
  color: white;
}

.step-indicator.completed::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 6px solid white;
  transform: translate(-50%, -50%);
  animation: checkmark 0.3s ease-in-out;
}

@keyframes checkmark {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.step-labels {
  text-align: center;
}

.current-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 4px;
}

.step-count {
  display: block;
  font-size: 14px;
  color: var(--ion-color-medium);
}

/* Responsive */
@media (max-width: 480px) {
  .step-indicators {
    margin-bottom: 8px;
  }

  .step-indicator {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .current-label {
    font-size: 14px;
  }

  .step-count {
    font-size: 12px;
  }
}
</style>
