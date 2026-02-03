<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tableau de bord</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="isManager" @click="goToProblemes" title="Gérer les problèmes">
            <ion-icon name="alert-circle"></ion-icon>
          </ion-button>
          <ion-button @click="refreshData">
            <ion-icon name="refresh" :class="{ 'rotating': isRefreshing }"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Barre de recherche -->
      <ion-toolbar class="search-toolbar">
        <ion-searchbar
          v-model="searchQuery"
          placeholder="Rechercher des signalements..."
          @ion-input="onSearchInput"
          class="dashboard-search"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="dashboard-content">
      <!-- Section statistiques -->
      <div class="stats-section">
        <ion-grid class="stats-grid">
          <ion-row>
            <ion-col size="6">
              <div class="stat-card" @click="setFilter('all')">
                <div class="stat-icon">
                  <ion-icon name="document" color="primary"></ion-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ stats.total }}</div>
                  <div class="stat-label">Total</div>
                </div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-card" @click="setFilter('new')">
                <div class="stat-icon stat-icon-danger">
                  <ion-icon name="alert-circle"></ion-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ stats.new }}</div>
                  <div class="stat-label">Nouveaux</div>
                </div>
              </div>
            </ion-col>
          </ion-row>
          <ion-row>
            <ion-col size="6">
              <div class="stat-card" @click="setFilter('in_progress')">
                <div class="stat-icon stat-icon-warning">
                  <ion-icon name="construct"></ion-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ stats.inProgress }}</div>
                  <div class="stat-label">En cours</div>
                </div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-card" @click="setFilter('completed')">
                <div class="stat-icon stat-icon-success">
                  <ion-icon name="checkmark-circle"></ion-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ stats.completed }}</div>
                  <div class="stat-label">Terminés</div>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>

      <!-- Filtres -->
      <div class="filters-section">
        <ion-segment
          v-model="selectedFilter"
          @ion-change="onFilterChange"
          scrollable
          class="filters-segment"
        >
          <ion-segment-button value="all">
            <ion-label>Tous</ion-label>
          </ion-segment-button>
          <ion-segment-button value="new">
            <ion-label>Nouveaux</ion-label>
          </ion-segment-button>
          <ion-segment-button value="in_progress">
            <ion-label>En cours</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Terminés</ion-label>
          </ion-segment-button>
          <ion-segment-button value="mine">
            <ion-label>Mes signalements</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <!-- Liste des signalements -->
      <div class="reports-section">
        <div class="section-header">
          <h3>Signalements {{ getFilterLabel(selectedFilter) }}</h3>
          <span class="results-count">{{ filteredReports.length }} résultat{{ filteredReports.length > 1 ? 's' : '' }}</span>
        </div>

        <ion-list v-if="filteredReports.length > 0" class="reports-list">
          <ion-item-sliding v-for="report in paginatedReports" :key="report.id">
            <ion-item
              class="report-item"
              @click="viewReportDetails(report)"
              button
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
                <div class="report-title-container">
                  <span class="report-type-emoji">{{ getTypeEmoji(report) }}</span>
                  <h2 class="report-title">{{ report.description || report.title || 'Sans description' }}</h2>
                </div>
                <p class="report-type-label">{{ getTypeLabel(report) }}</p>
                <p class="report-address">
                  <ion-icon name="location" size="small"></ion-icon>
                  {{ truncateText(report.address, 40) }}
                </p>
                <p class="report-meta">
                  <ion-badge :color="getStatusColor(report.status)" size="small">
                    {{ getStatusLabel(report.status) }}
                  </ion-badge>
                  <span class="report-date">{{ formatRelativeDate(report.dateCreation || report.createdAt) }}</span>
                </p>
              </ion-label>

              <ion-icon
                name="chevron-forward"
                slot="end"
                color="medium"
                class="item-chevron"
              ></ion-icon>
            </ion-item>

            <!-- Actions de swipe -->
            <ion-item-options side="end">
              <ion-item-option
                color="danger"
                @click="deleteReport(report)"
                expandable
              >
                <ion-icon name="trash" slot="icon-only"></ion-icon>
              </ion-item-option>
            </ion-item-options>

            <ion-item-options side="start">
              <ion-item-option
                v-if="report.status !== 'completed'"
                color="success"
                @click="markAsCompleted(report)"
                expandable
              >
                <ion-icon name="checkmark" slot="icon-only"></ion-icon>
                Terminé
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>

        <!-- État vide -->
        <div v-else class="empty-state">
          <ion-icon name="document-outline" size="large" color="medium"></ion-icon>
          <h3>Aucun signalement trouvé</h3>
          <p>Il n'y a pas de signalements correspondant à votre recherche.</p>
          <ion-button
            v-if="searchQuery"
            fill="clear"
            @click="clearSearch"
            class="clear-search-button"
          >
            Effacer la recherche
          </ion-button>
        </div>

        <!-- Pagination infinie -->
        <ion-infinite-scroll
          v-if="hasMoreReports"
          @ion-infinite="loadMoreReports"
          threshold="100px"
        >
          <ion-infinite-scroll-content
            loading-spinner="crescent"
            loading-text="Chargement..."
          ></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      </div>

      <!-- Pull to refresh -->
      <ion-refresher slot="fixed" @ion-refresh="handleRefresh($event)">
        <ion-refresher-content
          pulling-icon="chevron-down"
          pulling-text="Tirer pour actualiser"
          refreshing-spinner="crescent"
          refreshing-text="Actualisation..."
        ></ion-refresher-content>
      </ion-refresher>
    </ion-content>

    <!-- FAB pour nouveau signalement -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button router-link="/report/new">
        <ion-icon name="add"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonThumbnail,
  IonBadge,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  alertController,
  toastController
} from '@ionic/vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useReportsStore } from '@/stores/reports.store'
import { useAuthStore } from '@/stores/auth.store'
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/utils/constants'

// État réactif
const router = useRouter()
const authStore = useAuthStore()
const reportsStore = useReportsStore()

const selectedFilter = ref('all')
const searchQuery = ref('')
const isRefreshing = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(20)

// Normaliser les statuts français/anglais
const normalizeStatus = (status) => {
  if (!status) return 'new'
  const statusLower = status.toLowerCase()
  if (statusLower === 'nouveau' || statusLower === 'new') return 'new'
  if (statusLower === 'en_cours' || statusLower === 'in_progress') return 'in_progress'
  if (statusLower === 'termine' || statusLower === 'terminé' || statusLower === 'completed') return 'completed'
  return statusLower
}

// Getters calculés
const stats = computed(() => {
  const all = reportsStore.reports
  return {
    total: all.length,
    new: all.filter(r => normalizeStatus(r.status) === 'new').length,
    inProgress: all.filter(r => normalizeStatus(r.status) === 'in_progress').length,
    completed: all.filter(r => normalizeStatus(r.status) === 'completed').length
  }
})

const isManager = computed(() => {
  return authStore.user?.roles?.includes('MANAGER') || false
})

const filteredReports = computed(() => {
    let reports = [...reportsStore.reports]

    // Filtre par statut
    if (selectedFilter.value !== 'all') {
      if (selectedFilter.value === 'mine') {
        const userId = authStore.user?.id
        const userEmail = authStore.user?.email
        console.log('🔍 Filtre "Mes signalements":', { userId, userEmail, totalReports: reports.length })
        
        reports = reports.filter(r => {
          // Vérifier plusieurs champs possibles pour l'auteur
          const reportUserId = r.userId || r.user_id || r.createdBy || r.created_by
          const reportUserEmail = r.userEmail || r.user_email || r.email
          
          const match = reportUserId === userId || 
                       reportUserEmail === userEmail ||
                       r.user?.id === userId ||
                       r.user?.email === userEmail
          
          if (match) {
            console.log('✅ Signalement correspondant:', { 
              id: r.id, 
              reportUserId, 
              reportUserEmail,
              description: r.description?.substring(0, 30) 
            })
          }
          
          return match
        })
        
        console.log('📊 Résultats filtrés:', reports.length)
      } else {
        reports = reports.filter(r => normalizeStatus(r.status) === selectedFilter.value)
      }
    }

    // Appliquer la recherche
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      reports = reports.filter(report =>
        (report.title || report.description || '').toLowerCase().includes(query) ||
        (report.description || '').toLowerCase().includes(query) ||
        (report.address || '').toLowerCase().includes(query) ||
        getStatusLabel(report.status).toLowerCase().includes(query)
      )
  }

  return reports
})

const paginatedReports = computed(() => {
  const start = 0
  const end = currentPage.value * itemsPerPage.value
  return filteredReports.value.slice(start, end)
})

const hasMoreReports = computed(() => {
  return paginatedReports.value.length < filteredReports.value.length
})

// Méthodes
const setFilter = (filter) => {
  selectedFilter.value = filter
  reportsStore.setFilters({ status: filter })
}

const onFilterChange = (event) => {
  const filter = event.detail.value
  setFilter(filter)
}

const onSearchInput = (event) => {
  searchQuery.value = event.detail.value || ''
  currentPage.value = 1
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const getFilterLabel = (filter) => {
  const labels = {
    all: '',
    new: 'nouveaux',
    in_progress: 'en cours',
    completed: 'terminés',
    mine: 'personnels'
  }
  return labels[filter] || ''
}

const getStatusColor = (status) => {
  const normalized = normalizeStatus(status)
  const colors = {
    new: 'danger',
    in_progress: 'warning',
    completed: 'success'
  }
  return colors[normalized] || 'primary'
}

const getStatusLabel = (status) => {
  const normalized = normalizeStatus(status)
  return REPORT_STATUS_LABELS[normalized] || status
}

// Récupérer l'emoji du type
const getTypeEmoji = (report) => {
  const type = report?.type || null
  const typeId = type?.id || report?.typeId
  
  const idMap = {
    1: '⚠️',
    2: '🚗',
    3: '✓',
    4: '⚠️',
    5: '🔧',
    6: '💧',
    7: '🏁',
  }
  
  if (typeId && idMap[typeId]) {
    return idMap[typeId]
  }
  
  const label = type?.libelle || type?.label || ''
  const labelMap = {
    'Problème critique': '⚠️',
    'Travaux en cours': '🚗',
    'Problème résolu': '✓',
    'Infrastructure endommagée': '🔧',
    "Problème d'inondation": '💧',
    'Chaussée dégradée': '🏁',
  }
  
  return labelMap[label] || '📍'
}

const getTypeLabel = (report) => {
  const type = report?.type
  if (type?.libelle) return type.libelle
  const typeId = report?.typeId || report?.type?.id
  if (typeId) return `Type #${typeId}`
  return 'Non défini'
}

const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatRelativeDate = (dateValue) => {
  if (!dateValue) return 'Date inconnue'
  
  let date
  if (typeof dateValue === 'object') {
    // Gérer les Timestamps Firestore
    const seconds = dateValue?.seconds ?? dateValue?._seconds
    const nanos = dateValue?.nanoseconds ?? dateValue?._nanoseconds ?? 0
    if (typeof seconds === 'number') {
      date = new Date(seconds * 1000 + Math.floor(nanos / 1e6))
    } else if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate()
    } else {
      date = new Date(String(dateValue))
    }
  } else {
    date = new Date(dateValue)
  }
  
  if (Number.isNaN(date.getTime())) return 'Date inconnue'
  
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

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
}

const viewReportDetails = (report) => {
  reportsStore.setCurrentReport(report)
  router.push('/map')
}

const markAsCompleted = async (report) => {
  try {
    await reportsStore.updateReport(report.id, { status: 'completed' })
    await showToast('Signalement marqué comme terminé', 'success')
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    await showToast('Erreur lors de la mise à jour', 'danger')
  }
}

const deleteReport = async (report) => {
  const alert = await alertController.create({
    header: 'Confirmer la suppression',
    message: 'Êtes-vous sûr de vouloir supprimer ce signalement ? Cette action est irréversible.',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: async () => {
          try {
            const reportIndex = reportsStore.reports.findIndex(r => r.id === report.id)
            if (reportIndex > -1) {
              reportsStore.reports.splice(reportIndex, 1)
            }
            await showToast('Signalement supprimé', 'success')
          } catch (error) {
            console.error('Erreur lors de la suppression:', error)
            await showToast('Erreur lors de la suppression', 'danger')
          }
        }
      }
    ]
  })

  await alert.present()
}

const loadMoreReports = (event) => {
  setTimeout(() => {
    currentPage.value++
    event.target.complete()

    if (!hasMoreReports.value) {
      event.target.disabled = true
    }
  }, 1000)
}

const handleRefresh = async (event) => {
  isRefreshing.value = true

  try {
    await reportsStore.fetchReports()
    currentPage.value = 1
    searchQuery.value = ''
    await showToast('Données actualisées', 'success')
  } catch (error) {
    console.error('Erreur lors du rafraîchissement:', error)
    await showToast('Erreur lors du rafraîchissement', 'danger')
  } finally {
    isRefreshing.value = false
    event.detail.complete()
  }
}

const refreshData = async () => {
  await handleRefresh({ detail: { complete: () => {} } })
}

const goToProblemes = () => {
  router.push('/manager/problemes')
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

onMounted(async () => {
  console.log('📱 DashboardScreen mounted')
  console.log('👤 User actuel:', authStore.user)
  await reportsStore.fetchReports()
  console.log('📊 Signalements chargés:', reportsStore.reports.length)
  
  // Afficher un échantillon des données
  if (reportsStore.reports.length > 0) {
    console.log('📄 Échantillon de signalement:', {
      id: reportsStore.reports[0].id,
      userId: reportsStore.reports[0].userId,
      user_id: reportsStore.reports[0].user_id,
      createdBy: reportsStore.reports[0].createdBy,
      user: reportsStore.reports[0].user,
      description: reportsStore.reports[0].description?.substring(0, 30)
    })
  }
})

watch(() => selectedFilter.value, (newVal) => {
  console.log('🔄 Filtre changé:', newVal)
  currentPage.value = 1
})
</script>

<style scoped>
.dashboard-content {
  --background: var(--app-background);
}

.search-toolbar {
  --background: var(--app-surface);
  --border-width: 0;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 193, 7, 0.2);
}

.dashboard-search {
  --background: rgba(42, 42, 42, 0.8);
  --border-radius: 16px;
  --padding-start: 16px;
  --padding-end: 16px;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  --color: var(--ion-text-color);
  --placeholder-color: rgba(255, 255, 255, 0.5);
  margin: 0;
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.stats-section {
  padding: 16px;
  background: #2a2a2a;
  border-bottom: 2px solid rgba(255, 193, 7, 0.1);
}

.stats-grid {
  --ion-grid-padding: 0;
  --ion-grid-column-padding: 8px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(42, 42, 42, 0.95) 0%, rgba(26, 26, 26, 0.98) 100%);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 193, 7, 0.2);
  border: 2px solid rgba(255, 193, 7, 0.3);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ffc107, rgba(255, 193, 7, 0.3));
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 193, 7, 0.15);
  flex-shrink: 0;
}

.stat-icon ion-icon {
  font-size: 28px;
  color: var(--color-primary);
}

.stat-icon-danger {
  background: rgba(255, 59, 48, 0.15);
}

.stat-icon-danger ion-icon {
  color: var(--color-danger);
}

.stat-icon-warning {
  background: rgba(255, 149, 0, 0.15);
}

.stat-icon-warning ion-icon {
  color: var(--color-warning);
}

.stat-icon-success {
  background: rgba(52, 199, 89, 0.15);
}

.stat-icon-success ion-icon {
  color: var(--color-success);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  font-weight: 700;
  margin-top: 4px;
  letter-spacing: 0.5px;
}

.filters-section {
  padding: 12px 16px;
  background: #2a2a2a;
  border-bottom: 1px solid rgba(255, 193, 7, 0.2);
}

.filters-segment {
  --background: rgba(var(--app-background), 0.8);
}

.reports-section {
  flex: 1;
  background: var(--app-background);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #2a2a2a;
  border-bottom: 2px solid rgba(255, 193, 7, 0.1);
}

.section-header h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: var(--ion-color-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.results-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.reports-list {
  --ion-item-background: transparent;
  background: var(--app-background);
  padding: 8px 0;
}

.report-item {
  --border-radius: 16px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --background: rgba(42, 42, 42, 0.9);
  margin: 8px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-left: 4px solid #ffc107;
  border-radius: 16px;
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.report-thumbnail {
  --size: 70px;
  --border-radius: 12px;
  box-shadow: var(--shadow-sm);
}

.report-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 26, 0.8);
  border-radius: 12px;
  border: 2px dashed rgba(255, 193, 7, 0.3);
}

.no-image ion-icon {
  font-size: 32px;
  color: rgba(255, 193, 7, 0.5);
}

.report-label {
  margin-left: 12px;
  color: var(--ion-text-color);
}

.report-title-container {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 6px;
}

.report-type-emoji {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.report-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: var(--ion-text-color);
  line-height: 1.4;
  flex: 1;
}

.report-type-label {
  font-size: 12px;
  color: var(--ion-color-primary);
  margin: 0 0 8px 0;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.report-address {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.report-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
}

ion-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 8px;
}

.report-date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.item-chevron {
  opacity: 0.4;
  color: var(--ion-color-primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
}

.empty-state ion-icon {
  font-size: 72px;
  margin-bottom: 16px;
  color: rgba(255, 193, 7, 0.3);
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--ion-text-color);
}

.empty-state p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 16px 0;
  font-size: 14px;
}

/* Animation de rotation */
.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 480px) {
  .stat-card {
    padding: 14px;
    gap: 10px;
  }

  .stat-icon {
    width: 44px;
    height: 44px;
  }

  .stat-icon ion-icon {
    font-size: 24px;
  }

  .stat-number {
    font-size: 24px;
  }
}
</style>