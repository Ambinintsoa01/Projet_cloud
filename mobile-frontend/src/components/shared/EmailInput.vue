<template>
  <ion-item :class="['email-input', { 'ion-invalid': hasError }]">
    <ion-label position="floating">{{ label }}</ion-label>
    <ion-input
      :value="modelValue"
      type="email"
      :placeholder="placeholder"
      @ion-input="$emit('update:modelValue', $event.target.value)"
      :class="{ 'ion-invalid': hasError }"
    ></ion-input>
    <ion-icon
      v-if="modelValue && isValidEmail"
      name="checkmark-circle"
      color="success"
      slot="end"
      class="validation-icon"
    ></ion-icon>
    <ion-icon
      v-else-if="modelValue && !isValidEmail"
      name="close-circle"
      color="danger"
      slot="end"
      class="validation-icon"
    ></ion-icon>
    <ion-note v-if="errorMessage" slot="error" color="danger">
      {{ errorMessage }}
    </ion-note>
    <ion-note v-if="helperText && !errorMessage" slot="helper" color="medium">
      {{ helperText }}
    </ion-note>
  </ion-item>
</template>

<script setup>
import {
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonNote
} from '@ionic/vue'
import { computed } from 'vue'
import { validateEmail } from '@/utils/validators'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Email'
  },
  placeholder: {
    type: String,
    default: 'votre.email@example.com'
  },
  errorMessage: {
    type: String,
    default: ''
  },
  helperText: {
    type: String,
    default: ''
  },
  showValidation: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Getters calculés
const hasError = computed(() => !!props.errorMessage)

const isValidEmail = computed(() => {
  if (!props.modelValue) return false
  const validation = validateEmail(props.modelValue)
  return validation.isValid
})
</script>

<style scoped>
.email-input {
  --border-radius: var(--ion-border-radius);
  --padding-start: 16px;
  --inner-padding-end: 16px;
  margin-bottom: 16px;
}

.validation-icon {
  font-size: 20px;
}
</style>
