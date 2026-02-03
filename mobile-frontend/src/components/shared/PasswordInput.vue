<template>
  <ion-item :class="['password-input', { 'ion-invalid': hasError }]">
    <ion-label position="floating">{{ label }}</ion-label>
    <ion-input
      :value="modelValue"
      :type="showPassword ? 'text' : 'password'"
      :placeholder="placeholder"
      @ion-input="$emit('update:modelValue', $event.target.value)"
      :class="{ 'ion-invalid': hasError }"
    ></ion-input>
    <ion-button
      fill="clear"
      slot="end"
      @click="showPassword = !showPassword"
      class="password-toggle"
    >
      <ion-icon :name="showPassword ? 'eye-off' : 'eye'" color="medium"></ion-icon>
    </ion-button>
    <ion-note v-if="errorMessage" slot="error" color="danger">
      {{ errorMessage }}
    </ion-note>

    <!-- Barre de force du mot de passe (optionnelle) -->
    <div v-if="showStrength && modelValue" class="password-strength" slot="helper">
      <div class="strength-bar">
        <div
          class="strength-fill"
          :class="passwordStrengthClass"
          :style="{ width: `${passwordStrength}%` }"
        ></div>
      </div>
      <span class="strength-text">{{ passwordStrengthText }}</span>
    </div>
  </ion-item>
</template>

<script setup>
import {
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonNote
} from '@ionic/vue'
import { ref, computed } from 'vue'
import { getPasswordStrength } from '@/utils/validators'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Mot de passe'
  },
  placeholder: {
    type: String,
    default: 'Votre mot de passe'
  },
  errorMessage: {
    type: String,
    default: ''
  },
  showStrength: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// État réactif
const showPassword = ref(false)

// Getters calculés
const hasError = computed(() => !!props.errorMessage)

const passwordStrength = computed(() => {
  return props.modelValue ? getPasswordStrength(props.modelValue) : 0
})

const passwordStrengthClass = computed(() => {
  if (passwordStrength.value < 40) return 'weak'
  if (passwordStrength.value < 70) return 'medium'
  return 'strong'
})

const passwordStrengthText = computed(() => {
  if (passwordStrength.value < 40) return 'Faible'
  if (passwordStrength.value < 70) return 'Moyen'
  return 'Fort'
})
</script>

<style scoped>
.password-input {
  --border-radius: var(--ion-border-radius);
  --padding-start: 16px;
  --inner-padding-end: 16px;
  margin-bottom: 16px;
}

.password-toggle {
  --color: var(--ion-color-medium);
  --padding-start: 8px;
  --padding-end: 8px;
}

.password-strength {
  margin-top: 8px;
  width: 100%;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background-color: var(--ion-color-light);
  border-radius: 2px;
  margin-bottom: 4px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-fill.weak {
  background-color: var(--ion-color-danger);
}

.strength-fill.medium {
  background-color: var(--ion-color-warning);
}

.strength-fill.strong {
  background-color: var(--ion-color-success);
}

.strength-text {
  font-size: 12px;
  color: var(--ion-color-medium);
}
</style>
