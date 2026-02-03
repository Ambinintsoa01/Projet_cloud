<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="login-container">
        <!-- Logo et titre -->
        <div class="logo-section">
          <div class="logo-circle">
            <img src="/assets/images/logo.svg" alt="ROAD ALERT" class="logo-image" />
          </div>
          <h1 class="app-title">ROAD ALERT</h1>
          <p class="app-subtitle">Antananarivo</p>
          <div class="decoration-line"></div>
        </div>

        <!-- Formulaire de connexion -->
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- Email -->
          <div class="input-group">
            <ion-icon name="mail-outline" class="input-icon"></ion-icon>
            <ion-input
              v-model="formData.email"
              type="email"
              placeholder="Email"
              class="custom-input"
              :class="{ 'input-error': errors.email }"
            ></ion-input>
          </div>
          <ion-note v-if="errors.email" class="error-note">{{ errors.email }}</ion-note>

          <!-- Mot de passe -->
          <div class="input-group">
            <ion-icon name="lock-closed-outline" class="input-icon"></ion-icon>
            <ion-input
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Mot de passe"
              class="custom-input"
              :class="{ 'input-error': errors.password }"
            ></ion-input>
            <ion-button fill="clear" @click="showPassword = !showPassword" class="password-toggle">
              <ion-icon :name="showPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
            </ion-button>
          </div>
          <ion-note v-if="errors.password" class="error-note">{{ errors.password }}</ion-note>

          <!-- Bouton de connexion -->
          <ion-button
            expand="block"
            type="submit"
            :disabled="!isFormValid || isLoading || !isOnline"
            class="login-button"
          >
            <ion-spinner v-if="isLoading" slot="start" name="crescent"></ion-spinner>
            <span v-if="isLoading">Connexion...</span>
            <span v-else>Se connecter</span>
          </ion-button>
        </form>

        <!-- Status indicator -->
        <div class="status-container">
          <ion-badge :color="isOnline ? 'success' : 'warning'" class="status-badge">
            <ion-icon :name="isOnline ? 'wifi' : 'cloud-offline-outline'"></ion-icon>
            {{ isOnline ? 'En ligne' : 'Hors ligne' }}
          </ion-badge>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonNote,
  IonSpinner,
  IonBadge,
  toastController,
  loadingController
} from '@ionic/vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { validateLoginForm, validateEmail } from '@/utils/validators'
import { useOfflineStorage } from '@/composables/useOfflineStorage'

const router = useRouter()
const authStore = useAuthStore()
const { isOnline } = useOfflineStorage()

const formData = ref({
  email: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)
const errors = ref({})
const isLoading = ref(false)

const isFormValid = computed(() => {
  return formData.value.email &&
         formData.value.password &&
         Object.keys(errors.value).length === 0
})

const validateField = (field) => {
  const fieldErrors = {}

  if (field === 'email') {
    const emailValidation = validateEmail(formData.value.email)
    if (!emailValidation.isValid) {
      fieldErrors.email = emailValidation.message
    }
  }

  if (field === 'password') {
    if (!formData.value.password || formData.value.password.length < 1) {
      fieldErrors.password = 'Mot de passe requis'
    }
  }

  errors.value = {
    ...errors.value,
    ...fieldErrors
  }

  if (fieldErrors[field] === undefined) {
    delete errors.value[field]
  }
}

const validateForm = () => {
  const validation = validateLoginForm(formData.value)
  errors.value = validation.errors
  return validation.isValid
}

const handleLogin = async () => {
  if (!isOnline.value) {
    await showToast('Connexion Internet requise pour se connecter', 'danger')
    return
  }

  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errors.value = {}

  const loading = await loadingController.create({
    message: 'Connexion en cours...',
    spinner: 'crescent'
  })

  try {
    await loading.present()
    await new Promise(resolve => setTimeout(resolve, 2000))

    const result = await authStore.login(formData.value.email, formData.value.password)

    if (result.success) {
      await showToast('Connexion réussie !', 'success')
      await router.push('/map')
    } else {
      throw new Error('Erreur lors de la connexion')
    }

  } catch (error) {
    console.error('Erreur de connexion:', error)
    const errorMessage = error.message || 'Erreur lors de la connexion'
    await showToast(errorMessage, 'danger')

    if (errorMessage.includes('email')) {
      errors.value.email = errorMessage
    } else if (errorMessage.includes('mot de passe')) {
      errors.value.password = errorMessage
    }

  } finally {
    isLoading.value = false
    await loading.dismiss()
  }
}

const showToast = async (message, color = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'top'
  })
  await toast.present()
}

onMounted(async () => {
  if (!isOnline.value) {
    await showToast('Connexion Internet requise', 'warning')
  }

  if (process.env.NODE_ENV === 'development') {
    formData.value.email = 'test@example.com'
    formData.value.password = 'password123'
  }
})
</script>

<style scoped>
.login-content {
  --background: linear-gradient(135deg, var(--app-surface) 0%, var(--app-background) 100%);
}

.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 24px;
  position: relative;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: radial-gradient(circle at top, rgba(255, 193, 7, 0.1), transparent);
}

.logo-section {
  text-align: center;
  margin-bottom: 48px;
  animation: slideDown 0.6s ease-out;
  position: relative;
  z-index: 1;
}

.logo-circle {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: var(--shadow-lg), var(--shadow-glow);
  animation: pulse 2s ease-in-out infinite;
}

.logo-image {
  width: 72px;
  height: 72px;
  display: block;
}

.app-title {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.app-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0 0 24px 0;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.decoration-line {
  width: 60px;
  height: 4px;
  background: var(--color-primary);
  margin: 0 auto;
  border-radius: 2px;
}

.login-form {
  animation: fadeInUp 0.7s ease-out 0.2s both;
  position: relative;
  z-index: 1;
}

.input-group {
  position: relative;
  margin-bottom: 24px;
  background: var(--color-surface);
  border-radius: 16px;
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 16px;
  transition: all 0.3s ease;
}

.input-group:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow);
  background: var(--color-surface-elevated);
}

.input-group.input-error {
  border-color: var(--color-danger);
}

.input-icon {
  font-size: 24px;
  color: var(--color-text-secondary);
  margin-right: 12px;
}

.input-group:focus-within .input-icon {
  color: var(--color-primary);
}

.custom-input {
  --color: var(--color-text);
  --placeholder-color: var(--color-text-tertiary);
  --padding-start: 0;
  --padding-end: 0;
  flex: 1;
  font-size: 16px;
  min-height: 56px;
}

.password-toggle {
  --color: var(--color-text-secondary);
  margin: 0;
  --padding-start: 8px;
  --padding-end: 0;
}

.error-note {
  color: var(--color-danger);
  font-size: 12px;
  margin: -16px 0 16px 16px;
  display: block;
  font-weight: 600;
}

.login-button {
  margin-top: 32px;
  --border-radius: 16px;
  height: 56px;
  font-weight: 800;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  --background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  --box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.login-button:active {
  transform: scale(0.98);
}

.status-container {
  margin-top: auto;
  padding-top: 32px;
  display: flex;
  justify-content: center;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: var(--shadow-lg), var(--shadow-glow);
  }
  50% {
    transform: scale(1.05);
    box-shadow: var(--shadow-lg), 0 0 30px rgba(255, 193, 7, 0.5);
  }
}
</style>