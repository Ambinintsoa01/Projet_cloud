<template>
  <ion-page>
    <ion-content :fullscreen="true" class="register-content-modern">
      <div class="register-container">
        <!-- Logo -->
        <div class="logo-section">
          <ion-icon name="person-add-outline" size="large" color="primary"></ion-icon>
          <h2>Créer un compte</h2>
        </div>

        <!-- Indicateur de progression -->
        <div class="progress-section">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
          <div class="step-indicators">
            <div
              v-for="step in 3"
              :key="step"
              class="step-indicator"
              :class="{
                active: currentStep >= step,
                completed: currentStep > step
              }"
            >
              <ion-icon
                v-if="currentStep > step"
                name="checkmark"
                size="small"
              ></ion-icon>
              <span v-else>{{ step }}</span>
            </div>
          </div>
          <p class="step-text">{{ currentStepText }}</p>
        </div>

        <!-- Formulaire multi-étapes -->
        <form @submit.prevent="handleSubmit" class="register-form">
          <!-- Étape 1: Informations personnelles -->
          <div v-if="currentStep === 1" class="step-content">
            <ion-item class="form-item">
              <ion-label position="floating">Nom complet *</ion-label>
              <ion-input
                v-model="formData.fullName"
                placeholder="Votre nom complet"
                @ion-input="validateField('fullName')"
                :class="{ 'ion-invalid': errors.fullName }"
              ></ion-input>
              <ion-note v-if="errors.fullName" slot="error" color="danger">
                {{ errors.fullName }}
              </ion-note>
            </ion-item>

            <ion-item class="form-item">
              <ion-label position="floating">Email *</ion-label>
              <ion-input
                v-model="formData.email"
                type="email"
                placeholder="votre.email@example.com"
                @ion-input="validateField('email')"
                :class="{ 'ion-invalid': errors.email }"
              ></ion-input>
              <ion-note v-if="errors.email" slot="error" color="danger">
                {{ errors.email }}
              </ion-note>
            </ion-item>
          </div>

          <!-- Étape 2: Sécurité -->
          <div v-if="currentStep === 2" class="step-content">
            <ion-item class="form-item">
              <ion-label position="floating">Mot de passe *</ion-label>
              <ion-input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Minimum 8 caractères"
                @ion-input="validateField('password')"
                :class="{ 'ion-invalid': errors.password }"
              ></ion-input>
              <ion-button
                fill="clear"
                slot="end"
                @click="showPassword = !showPassword"
                class="password-toggle"
              >
                <ion-icon :name="showPassword ? 'eye-off' : 'eye'" color="medium"></ion-icon>
              </ion-button>
              <ion-note v-if="errors.password" slot="error" color="danger">
                {{ errors.password }}
              </ion-note>
            </ion-item>

            <!-- Indicateur de force du mot de passe -->
            <div v-if="formData.password" class="password-strength">
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :class="passwordStrengthClass"
                  :style="{ width: `${passwordStrength}%` }"
                ></div>
              </div>
              <span class="strength-text">{{ passwordStrengthText }}</span>
            </div>

            <ion-item class="form-item">
              <ion-label position="floating">Confirmer le mot de passe *</ion-label>
              <ion-input
                v-model="formData.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Répétez votre mot de passe"
                @ion-input="validateField('confirmPassword')"
                :class="{ 'ion-invalid': errors.confirmPassword }"
              ></ion-input>
              <ion-button
                fill="clear"
                slot="end"
                @click="showConfirmPassword = !showConfirmPassword"
                class="password-toggle"
              >
                <ion-icon :name="showConfirmPassword ? 'eye-off' : 'eye'" color="medium"></ion-icon>
              </ion-button>
              <ion-note v-if="errors.confirmPassword" slot="error" color="danger">
                {{ errors.confirmPassword }}
              </ion-note>
            </ion-item>
          </div>

          <!-- Étape 3: Conditions -->
          <div v-if="currentStep === 3" class="step-content">
            <div class="terms-section">
              <h3>Conditions d'utilisation</h3>
              <div class="terms-content">
                <p>En créant un compte, vous acceptez :</p>
                <ul>
                  <li>De fournir des informations exactes</li>
                  <li>D'utiliser l'application de manière responsable</li>
                  <li>De respecter les autres utilisateurs</li>
                  <li>De signaler uniquement des problèmes réels</li>
                </ul>
              </div>

              <ion-item lines="none" class="terms-item">
                <ion-checkbox
                  v-model="formData.acceptTerms"
                  slot="start"
                  @ion-change="validateField('acceptTerms')"
                  :class="{ 'ion-invalid': errors.acceptTerms }"
                ></ion-checkbox>
                <ion-label class="terms-label">
                  J'accepte les conditions d'utilisation *
                </ion-label>
              </ion-item>
              <ion-note v-if="errors.acceptTerms" color="danger">
                {{ errors.acceptTerms }}
              </ion-note>
            </div>
          </div>

          <!-- Boutons de navigation -->
          <div class="form-actions">
            <ion-button
              v-if="currentStep > 1"
              fill="outline"
              @click="previousStep"
              :disabled="isLoading"
              class="nav-button"
            >
              <ion-icon name="arrow-back" slot="start"></ion-icon>
              Précédent
            </ion-button>

            <ion-button
              v-if="currentStep < 3"
              @click="nextStep"
              :disabled="!canGoNext || isLoading"
              class="nav-button primary"
            >
              Suivant
              <ion-icon name="arrow-forward" slot="end"></ion-icon>
            </ion-button>

            <ion-button
              v-if="currentStep === 3"
              type="submit"
              expand="block"
              :disabled="!isFormValid || isLoading"
              class="submit-button"
              :class="{ 'button-loading': isLoading }"
            >
              <ion-spinner v-if="isLoading" slot="start" name="crescent"></ion-spinner>
              <span v-if="isLoading">Création du compte...</span>
              <span v-else>Créer mon compte</span>
            </ion-button>
          </div>
        </form>
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
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonNote,
  IonCheckbox,
  IonSpinner,
  IonButtons,
  toastController,
  loadingController
} from '@ionic/vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { validateRegisterForm, validateFullName, validateEmail, validatePassword, validatePasswordConfirmation, getPasswordStrength } from '@/utils/validators'

// État réactif
const router = useRouter()
const authStore = useAuthStore()

const currentStep = ref(1)
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const formData = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const errors = ref({})

// Getters calculés
const progressPercentage = computed(() => (currentStep.value / 3) * 100)

const currentStepText = computed(() => {
  const steps = {
    1: 'Informations personnelles',
    2: 'Sécurité du compte',
    3: 'Validation des conditions'
  }
  return steps[currentStep.value]
})

const passwordStrength = computed(() => {
  return formData.value.password ? getPasswordStrength(formData.value.password) : 0
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

const canGoNext = computed(() => {
  switch (currentStep.value) {
    case 1:
      return formData.value.fullName && formData.value.email &&
             !errors.value.fullName && !errors.value.email
    case 2:
      return formData.value.password && formData.value.confirmPassword &&
             !errors.value.password && !errors.value.confirmPassword
    case 3:
      return formData.value.acceptTerms && !errors.value.acceptTerms
    default:
      return false
  }
})

const isFormValid = computed(() => {
  return formData.value.fullName &&
         formData.value.email &&
         formData.value.password &&
         formData.value.confirmPassword &&
         formData.value.acceptTerms &&
         Object.keys(errors.value).length === 0
})

// Méthodes
const validateField = (field) => {
  const fieldErrors = {}

  switch (field) {
    case 'fullName':
      const nameValidation = validateFullName(formData.value.fullName)
      if (!nameValidation.isValid) {
        fieldErrors.fullName = nameValidation.message
      }
      break

    case 'email':
      const emailValidation = validateEmail(formData.value.email)
      if (!emailValidation.isValid) {
        fieldErrors.email = emailValidation.message
      }
      break

    case 'password':
      const passwordValidation = validatePassword(formData.value.password)
      if (!passwordValidation.isValid) {
        fieldErrors.password = passwordValidation.message
      }

      // Re-valider la confirmation si le mot de passe change
      if (formData.value.confirmPassword) {
        const confirmValidation = validatePasswordConfirmation(formData.value.password, formData.value.confirmPassword)
        if (!confirmValidation.isValid) {
          fieldErrors.confirmPassword = confirmValidation.message
        }
      }
      break

    case 'confirmPassword':
      const confirmValidation = validatePasswordConfirmation(formData.value.password, formData.value.confirmPassword)
      if (!confirmValidation.isValid) {
        fieldErrors.confirmPassword = confirmValidation.message
      }
      break

    case 'acceptTerms':
      if (!formData.value.acceptTerms) {
        fieldErrors.acceptTerms = 'Vous devez accepter les conditions d\'utilisation'
      }
      break
  }

  // Mettre à jour les erreurs
  errors.value = {
    ...errors.value,
    ...fieldErrors
  }

  // Supprimer l'erreur si elle est résolue
  if (fieldErrors[field] === undefined) {
    delete errors.value[field]
  }
}

const nextStep = () => {
  if (canGoNext.value && currentStep.value < 3) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    return
  }

  isLoading.value = true

  const loading = await loadingController.create({
    message: 'Création du compte...',
    spinner: 'crescent'
  })

  try {
    await loading.present()

    // Simulation d'appel API avec délai
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Tentative d'inscription
    const result = await authStore.register({
      fullName: formData.value.fullName,
      email: formData.value.email,
      password: formData.value.password,
      confirmPassword: formData.value.confirmPassword
    })

    if (result.success) {
      // Succès
      await showToast('Compte créé avec succès !', 'success')

      // Redirection vers la carte
      await router.push('/map')
    } else {
      throw new Error('Erreur lors de la création du compte')
    }

  } catch (error) {
    console.error('Erreur d\'inscription:', error)

    const errorMessage = error.message || 'Erreur lors de la création du compte'
    await showToast(errorMessage, 'danger')

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

// Initialisation
onMounted(() => {
  // Pré-remplir avec des données de test en développement
  if (process.env.NODE_ENV === 'development') {
    formData.value.fullName = 'Jean Dupont'
    formData.value.email = 'jean.dupont@example.com'
  }
})
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px 0;
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo-section ion-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.logo-section h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 8px 0;
  color: var(--ion-color-primary);
}

.progress-section {
  margin-bottom: 30px;
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
  transition: width 0.3s ease;
}

.step-indicators {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

/* 📱 Mobile-First Step Indicators */
.step-indicator {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: var(--ion-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--ion-color-medium);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.step-indicator.active {
  background-color: var(--ion-color-primary);
  color: var(--ion-text-color);
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(var(--ion-color-primary-rgb), 0.4);
}

.step-indicator.completed {
  background-color: var(--ion-color-success);
  color: var(--ion-text-color);
  box-shadow: 0 2px 12px rgba(var(--ion-color-success-rgb), 0.3);
}

.step-text {
  text-align: center;
  font-size: 15px;
  font-weight: 500;
  color: var(--ion-color-medium);
  margin: 8px 0 0 0;
}

/* 📝 Form Optimizations */
.register-form {
  margin-bottom: 24px;
}

.step-content {
  animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-item {
  margin-bottom: 20px;
  --border-radius: 12px;
  --padding-start: 20px;
  --inner-padding-end: 20px;
  --min-height: 56px;
  --background: var(--ion-item-background, #fff);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.form-item:focus-within {
  --background: var(--ion-color-light);
  box-shadow: 0 4px 16px rgba(var(--ion-color-primary-rgb), 0.15);
  transform: translateY(-2px);
}

.password-toggle {
  --color: var(--ion-color-medium);
  --padding-start: 12px;
  --padding-end: 12px;
  min-width: 44px;
  min-height: 44px;
}

/* 🔐 Password Strength Indicator */
.password-strength {
  margin: 12px 0 20px 0;
  padding: 0 4px;
}

.strength-bar {
  width: 100%;
  height: 6px;
  background-color: var(--ion-color-light);
  border-radius: 3px;
  margin-bottom: 8px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}

.strength-fill {
  height: 100%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 3px;
}

.strength-fill.weak {
  background: linear-gradient(90deg, var(--ion-color-danger), var(--ion-color-danger-shade));
}

.strength-fill.medium {
  background: linear-gradient(90deg, var(--ion-color-warning), var(--ion-color-warning-shade));
}

.strength-fill.strong {
  background: linear-gradient(90deg, var(--ion-color-success), var(--ion-color-success-shade));
}

.strength-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--ion-color-medium);
}

/* 📄 Terms Section */
.terms-section {
  margin-bottom: 24px;
}

.terms-section h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: var(--ion-color-dark);
}

.terms-content {
  background-color: var(--ion-color-light);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  max-height: 280px;
  overflow-y: auto;
}

.terms-content p {
  margin: 0 0 12px 0;
  font-size: 15px;
  line-height: 1.6;
}

.terms-content ul {
  margin: 0;
  padding-left: 24px;
}

.terms-content li {
  font-size: 15px;
  margin-bottom: 8px;
  line-height: 1.5;
}

.terms-item {
  --border-radius: 12px;
  --background: transparent;
  --min-height: 48px;
  --padding-start: 8px;
}

.terms-item ion-checkbox {
  --size: 24px;
  margin-right: 12px;
}

.terms-label {
  font-size: 15px;
  line-height: 1.5;
  font-weight: 500;
}

/* 🎯 Action Buttons */
.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}

.nav-button {
  flex: 1;
  --border-radius: 12px;
  height: 52px;
  font-weight: 600;
  font-size: 15px;
  text-transform: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.nav-button:active {
  transform: scale(0.98);
}

.nav-button.primary {
  --background: var(--ion-color-primary);
  box-shadow: 0 4px 16px rgba(var(--ion-color-primary-rgb), 0.3);
}

.submit-button {
  --border-radius: 12px;
  height: 56px;
  font-weight: 700;
  font-size: 16px;
  margin-top: 20px;
  text-transform: none;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 16px rgba(var(--ion-color-success-rgb), 0.3);
  transition: all 0.3s ease;
}

.submit-button:active {
  transform: scale(0.98);
}

.button-loading {
  opacity: 0.7;
  pointer-events: none;
}

/* 🎨 Enhanced Animations */
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

/* 📱 Mobile Responsive */
@media (max-width: 480px) {
  .register-container {
    padding: 20px 16px 16px;
  }

  .step-indicator {
    width: 40px;
    height: 40px;
    font-size: 15px;
  }

  .step-text {
    font-size: 13px;
  }

  .form-item {
    --min-height: 52px;
    margin-bottom: 16px;
  }

  .terms-content {
    max-height: 240px;
    padding: 16px;
  }

  .form-actions {
    flex-direction: column;
    gap: 12px;
  }

  .nav-button,
  .submit-button {
    width: 100%;
    height: 52px;
  }
}

/* 🌙 Dark Mode */
@media (prefers-color-scheme: dark) {
  .form-item {
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }

  .terms-content {
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }

  .step-indicator {
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
}

/* ♿ Accessibility */
.nav-button:focus-visible,
.submit-button:focus-visible,
.password-toggle:focus-visible {
  outline: 2px solid var(--ion-color-primary);
  outline-offset: 2px;
}
</style>
