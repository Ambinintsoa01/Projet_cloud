<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="app-logo">ROAD ALERT</span>
          <span class="title-sep">•</span>
          <span class="app-title">Profil</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="profile-content">
      <!-- En-tête du profil -->
      <div class="profile-header">
        <div class="avatar-section">
          <ion-avatar class="profile-avatar">
            <img
              v-if="user.avatar"
              :src="user.avatar"
              :alt="'Avatar de ' + (user.fullName || user.name || 'Utilisateur')"
            />
            <div v-else class="avatar-placeholder">
              <ion-icon name="person" size="large"></ion-icon>
            </div>
          </ion-avatar>
          <h2 class="user-name">{{ user.fullName || user.name || user.email || 'Utilisateur' }}</h2>
          <p class="user-email">{{ user.email || 'Email non défini' }}</p>
        </div>
      </div>

      <!-- Statistiques utilisateur -->
      <div class="stats-section">
        <ion-grid class="user-stats">
          <ion-row>
            <ion-col size="4">
              <div class="stat-item">
                <div class="stat-value">{{ userStats.total }}</div>
                <div class="stat-label">Signalements</div>
              </div>
            </ion-col>
            <ion-col size="4">
              <div class="stat-item">
                <div class="stat-value">{{ userStats.resolved }}</div>
                <div class="stat-label">Résolus</div>
              </div>
            </ion-col>
            <ion-col size="4">
              <div class="stat-item">
                <div class="stat-value">{{ userStats.points }}</div>
                <div class="stat-label">Points</div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>

      <!-- Menu du profil -->
      <ion-list class="profile-menu">
        <!-- Informations personnelles -->
        <ion-item-group>
          <ion-item-divider>
            <ion-label>Informations personnelles</ion-label>
          </ion-item-divider>

          <ion-item button @click="editProfile" detail>
            <ion-icon name="person" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Modifier le profil</h3>
              <p>Nom, email, avatar</p>
            </ion-label>
          </ion-item>

          <ion-item button @click="changePassword" detail>
            <ion-icon name="lock-closed" slot="start" color="secondary"></ion-icon>
            <ion-label>
              <h3>Changer le mot de passe</h3>
              <p>Sécuriser votre compte</p>
            </ion-label>
          </ion-item>
        </ion-item-group>

        <!-- Préférences -->
        <ion-item-group>
          <ion-item-divider>
            <ion-label>Préférences</ion-label>
          </ion-item-divider>

          <!-- Mode sombre : Toggle pour activer/désactiver le thème sombre -->
          <ion-item>
            <ion-icon name="moon" slot="start" color="tertiary"></ion-icon>
            <ion-label>Mode sombre</ion-label>
            <ion-toggle
              :checked="isDarkMode"
              @ion-change="toggleDarkMode($event.detail.checked)"
              slot="end"
            ></ion-toggle>
          </ion-item>

          <ion-item>
            <ion-icon name="notifications" slot="start" color="warning"></ion-icon>
            <ion-label>Notifications push</ion-label>
            <ion-toggle
              v-model="preferences.notifications"
              @ion-change="updatePreference('notifications', $event.detail.checked)"
              slot="end"
            ></ion-toggle>
          </ion-item>

          <!-- Langue : Cliquez pour choisir entre Français et Malagasy -->
          <ion-item button @click="selectLanguage" detail>
            <ion-icon name="language" slot="start" color="success"></ion-icon>
            <ion-label>
              <h3>Langue</h3>
              <p>{{ preferences.language === 'fr' ? 'Français' : 'Malagasy' }}</p>
            </ion-label>
          </ion-item>

        </ion-item-group>


        <!-- Support et aide -->
        <ion-item-group>
          <ion-item-divider>
            <ion-label>Support & Aide</ion-label>
          </ion-item-divider>

          <ion-item button @click="showHelp" detail>
            <ion-icon name="help-circle" slot="start" color="info"></ion-icon>
            <ion-label>
              <h3>Aide & FAQ</h3>
              <p>Questions fréquentes</p>
            </ion-label>
          </ion-item>

          <ion-item button @click="contactSupport" detail>
            <ion-icon name="mail" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Contacter le support</h3>
              <p>Signaler un problème</p>
            </ion-label>
          </ion-item>

          <ion-item button @click="showAbout" detail>
            <ion-icon name="information-circle" slot="start" color="medium"></ion-icon>
            <ion-label>
              <h3>À propos</h3>
              <p>Version {{ appVersion }}</p>
            </ion-label>
          </ion-item>
        </ion-item-group>
      </ion-list>

      <!-- Bouton de déconnexion -->
      <div class="logout-section">
        <ion-button
          expand="block"
          fill="outline"
          color="danger"
          @click="confirmLogout"
          class="logout-button"
        >
          <ion-icon name="log-out" slot="start"></ion-icon>
          Se déconnecter
        </ion-button>
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
  IonList,
  IonItemGroup,
  IonItemDivider,
  IonItem,
  IonLabel,
  IonIcon,
  IonAvatar,
  IonToggle,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  alertController,
  actionSheetController,
  toastController
} from '@ionic/vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useReportsStore } from '@/stores/reports.store'
import { storageService } from '@/services/storage.service'
import { useOfflineStorage } from '@/composables/useOfflineStorage'

// État réactif
const router = useRouter()
const authStore = useAuthStore()
const reportsStore = useReportsStore()
const { exportData: exportOfflineData, syncOfflineData } = useOfflineStorage()

const preferences = ref(storageService.getUserPreferences())
const storageStats = ref(storageService.getStorageStats())
const isSyncing = ref(false)
const lastSync = ref(storageService.getAppSettings().lastSync)

// Getters calculés
const user = computed(() => {
  const userData = authStore.user || {}
  console.log('👤 User data:', userData)
  return userData
})

const userStats = computed(() => {
  // Récupérer tous les signalements de l'utilisateur
  const userId = authStore.user?.id
  const userEmail = authStore.user?.email
  
  console.log('📊 Calcul stats pour:', { userId, userEmail })
  console.log('📊 Total signalements:', reportsStore.reports.length)
  
  const myReports = reportsStore.reports.filter(r => {
    const reportUserId = r.userId || r.user_id || r.createdBy || r.created_by
    const reportUserEmail = r.userEmail || r.user_email || r.email
    
    return reportUserId === userId || 
           reportUserEmail === userEmail ||
           r.user?.id === userId ||
           r.user?.email === userEmail
  })
  
  console.log('📊 Mes signalements:', myReports.length)
  
  return {
    total: myReports.length,
    resolved: myReports.filter(r => {
      const status = (r.status || '').toLowerCase()
      return status === 'completed' || status === 'terminé' || status === 'termine'
    }).length,
    points: myReports.length * 10 // 10 points par signalement
  }
})

const lastSyncText = computed(() => {
  if (!lastSync.value) return 'Jamais synchronisé'

  const date = new Date(lastSync.value)
  const now = new Date()
  const diffHours = Math.floor((now - date) / (1000 * 60 * 60))

  if (diffHours < 1) return 'Il y a moins d\'une heure'
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`

  const diffDays = Math.floor(diffHours / 24)
  return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
})

const appVersion = computed(() => '1.0.0')

// Méthodes
const editProfile = () => {
  showToast('Fonctionnalité à venir', 'warning')
}

const changePassword = () => {
  showToast('Fonctionnalité à venir', 'warning')
}

// Computed pour le mode sombre
const isDarkMode = computed(() => {
  return preferences.value.darkMode || false
})

// Toggle mode sombre
const toggleDarkMode = async (enabled) => {
  try {
    preferences.value.darkMode = enabled
    
    // Appliquer le thème sur le document
    document.documentElement.classList.toggle('ion-palette-dark', enabled)
    
    // Sauvegarder la préférence
    storageService.setUserPreferences(preferences.value)
    
    const message = enabled ? 'Mode sombre activé' : 'Mode clair activé'
    await showToast(message, 'success')
    
    console.log('🌙 Mode sombre:', enabled)
  } catch (error) {
    console.error('Erreur mode sombre:', error)
    await showToast('Erreur lors du changement de thème', 'danger')
  }
}

const updatePreference = async (key, value) => {
  try {
    preferences.value[key] = value
    storageService.setUserPreferences(preferences.value)
    await showToast('Préférence mise à jour', 'success')
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    await showToast('Erreur lors de la mise à jour', 'danger')
  }
}

const selectLanguage = async () => {
  const actionSheet = await actionSheetController.create({
    header: 'Choisir la langue',
    buttons: [
      {
        text: 'Français',
        icon: preferences.value.language === 'fr' ? 'checkmark' : undefined,
        handler: async () => {
          preferences.value.language = 'fr'
          storageService.setUserPreferences(preferences.value)
          await showToast('Langue changée : Français', 'success')
          console.log('🌍 Langue:', 'fr')
        }
      },
      {
        text: 'Malagasy',
        icon: preferences.value.language === 'mg' ? 'checkmark' : undefined,
        handler: async () => {
          preferences.value.language = 'mg'
          storageService.setUserPreferences(preferences.value)
          await showToast('Langue changée : Malagasy', 'success')
          console.log('🌍 Langue:', 'mg')
        }
      },
      {
        text: 'Annuler',
        role: 'cancel'
      }
    ]
  })

  await actionSheet.present()
}

const syncData = async () => {
  if (isSyncing.value) return

  isSyncing.value = true

  try {
    const result = await syncOfflineData()

    if (result.success) {
      lastSync.value = new Date().toISOString()
      storageService.setAppSettings({ lastSync: lastSync.value })

      await showToast(`${result.synced} éléments synchronisés`, 'success')
    } else {
      await showToast('Erreur de synchronisation', 'danger')
    }
  } catch (error) {
    console.error('Erreur de synchronisation:', error)
    await showToast('Erreur de synchronisation', 'danger')
  } finally {
    isSyncing.value = false
  }
}

const exportData = async () => {
  try {
    await exportOfflineData()
    await showToast('Données exportées avec succès', 'success')
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    await showToast('Erreur lors de l\'export', 'danger')
  }
}

const viewStorageStats = async () => {
  const stats = storageStats.value

  const alert = await alertController.create({
    header: 'Statistiques de stockage',
    message: `
      <div style="text-align: left; line-height: 1.6;">
        <strong>Application:</strong> ${stats.appSize}KB (${stats.appKeys} clés)<br>
        <strong>Total navigateur:</strong> ${stats.totalSize}KB (${stats.totalKeys} clés)<br>
        <br>
        <em>Les données sont stockées localement dans votre navigateur.</em>
      </div>
    `,
    buttons: ['OK']
  })

  await alert.present()
}

const showHelp = () => {
  showToast('Centre d\'aide à venir', 'info')
}

const contactSupport = () => {
  showToast('Support client à venir', 'info')
}

const showAbout = async () => {
  const alert = await alertController.create({
    header: 'À propos',
    subHeader: 'Signalement Travaux Routiers',
    message: `
      <div style="text-align: center;">
        <p><strong>Version:</strong> ${appVersion.value}</p>
        <p><strong>Développeur:</strong> MrRojo Team</p>
        <p><strong>Année:</strong> 2026</p>
        <br>
        <p style="font-size: 14px; color: var(--ion-color-medium);">
          Application mobile de signalement des problèmes routiers à Antananarivo.
        </p>
      </div>
    `,
    buttons: ['Fermer']
  })

  await alert.present()
}

const confirmLogout = async () => {
  const alert = await alertController.create({
    header: 'Confirmer la déconnexion',
    message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Se déconnecter',
        role: 'destructive',
        handler: async () => {
          await logout()
        }
      }
    ]
  })

  await alert.present()
}

const logout = async () => {
  try {
    await authStore.logout()
    await showToast('Déconnexion réussie', 'success')
    router.push('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    await showToast('Erreur lors de la déconnexion', 'danger')
  }
}

const showToast = async (message, color = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: 'top'
  })
  await toast.present()
}

// Cycle de vie
onMounted(async () => {
  console.log('📱 ProfileScreen mounted')
  console.log('👤 User:', authStore.user)
  
  // Vérifier et appliquer le mode sombre seulement s'il est activé
  if (preferences.value.darkMode === true) {
    document.documentElement.classList.add('ion-palette-dark')
    console.log('🌙 Mode sombre appliqué')
  } else {
    document.documentElement.classList.remove('ion-palette-dark')
    console.log('☀️ Mode clair appliqué')
  }
  
  // Charger les signalements si pas encore chargés
  if (reportsStore.reports.length === 0) {
    console.log('🔄 Chargement des signalements...')
    await reportsStore.fetchReports()
    console.log('✅ Signalements chargés:', reportsStore.reports.length)
  }
  
  // Actualiser les statistiques de stockage
  storageStats.value = storageService.getStorageStats()
  console.log('💾 Stats stockage:', storageStats.value)
  console.log('🌍 Langue actuelle:', preferences.value.language || 'fr')
  console.log('🌙 Mode sombre:', preferences.value.darkMode)
})
</script>

<style scoped>
/* 🎨 Theme adaptatif - Mode clair par défaut, sombre au toggle */
.profile-content {
  --background: var(--app-background);
}

.profile-header {
  background: linear-gradient(135deg, var(--app-surface) 0%, var(--app-background) 100%);
  border-bottom: 2px solid var(--ion-color-primary);
  padding: 32px 20px 24px 20px;
  color: var(--ion-text-color);
  text-align: center;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  border: 3px solid #ffc107;
  box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 193, 7, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.user-name {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 6px 0;
  color: var(--ion-color-primary);
  letter-spacing: -0.3px;
}

.user-email {
  font-size: 15px;
  color: #ffffff;
  opacity: 0.9;
  margin: 0;
  word-break: break-all;
}

.stats-section {
  padding: 22px;
  background: var(--app-background);
  border-bottom: 1px solid var(--app-border);
}

.stat-item {
  background: #2a2a2a;
  border: 1px solid rgba(255, 193, 7, 0.2);
  border-radius: 14px;
  padding: 18px 14px;
  text-align: center;
  box-shadow: 0 3px 12px rgba(255, 193, 7, 0.08);
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--ion-color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #ffffff;
  text-transform: uppercase;
  font-weight: 600;
  margin-top: 6px;
  letter-spacing: 0.5px;
}

.profile-menu {
  --ion-item-background: #2a2a2a;
  margin: 0;
  background: transparent;
}

.profile-menu ion-item-group {
  margin-bottom: 18px;
}

.profile-menu ion-item-divider {
  --background: rgba(255, 193, 7, 0.2);
  --color: var(--ion-color-primary);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.6px;
}

.profile-menu ion-item {
  --border-radius: 12px;
  margin: 6px 16px;
  --background: #2a2a2a;
  box-shadow: 0 2px 10px rgba(255, 193, 7, 0.08);
  min-height: 56px;
  border-left: 4px solid #ffc107;
}

.profile-menu ion-item h3 {
  font-weight: 700;
  margin: 0;
  font-size: 15px;
  color: var(--ion-color-primary);
}

.profile-menu ion-item p {
  margin: 3px 0 0 0;
  font-size: 14px;
  color: #ffffff;
  line-height: 1.4;
}

.logout-section {
  padding: 24px 16px 44px 16px;
}

.logout-button {
  --border-radius: 12px;
  --background: #ff6b6b;
  --color: var(--ion-text-color);
  --border-color: #ff6b6b;
  font-weight: 700;
  min-height: 52px;
  letter-spacing: 0.3px;
}

/* Responsive */
@media (max-width: 480px) {
  .profile-header {
    padding: 26px 16px 20px 16px;
  }

  .profile-avatar {
    width: 76px;
    height: 76px;
  }

  .user-name {
    font-size: 22px;
  }

  .user-email {
    font-size: 14px;
  }

  .stats-section {
    padding: 18px;
  }

  .stat-item {
    padding: 14px 10px;
  }

  .stat-value {
    font-size: 22px;
  }

  .profile-menu ion-item {
    margin: 4px 12px;
  }
}
</style>
