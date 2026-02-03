<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button router-link="/map">
            <ion-icon name="arrow-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>
          <span class="app-logo">ROAD ALERT</span>
          <span class="title-sep">•</span>
          <span class="app-title">Recherche</span>
        </ion-title>
      </ion-toolbar>

      <!-- Barre de recherche principale -->
      <ion-toolbar class="search-toolbar">
        <ion-searchbar
          ref="searchInput"
          v-model="searchQuery"
          placeholder="Rechercher des signalements..."
          @ion-input="onSearchInput"
          @ion-clear="clearSearch"
          class="main-search"
          show-clear-button="always"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="search-content">
      <!-- Filtres avancés -->
      <div v-if="showAdvancedFilters" class="advanced-filters">
        <ion-accordion-group value="filters">
          <ion-accordion value="filters">
            <ion-item slot="header" class="accordion-header">
              <ion-icon name="filter" slot="start"></ion-icon>
              <ion-label>Filtres avancés</ion-label>
              <ion-badge v-if="activeFiltersCount > 0" slot="end" color="primary">
                {{ activeFiltersCount }}
              </ion-badge>
            </ion-item>

            <div class="accordion-content" slot="content">
              <!-- Filtre par statut -->
              <div class="filter-section">
                <h4>Statut</h4>
                <ion-segment
                  v-model="filters.status"
                  @ion-change="updateFilters"
                  class="status-filter"
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
                </ion-segment>
              </div>

              <!-- Filtre par catégorie -->
              <div class="filter-section">
                <h4>Catégorie</h4>
                <ion-select
                  v-model="filters.category"
                  placeholder="Toutes les catégories"
                  @ion-change="updateFilters"
                  class="category-filter"
                >
                  <ion-select-option value="all">Toutes les catégories</ion-select-option>
                  <ion-select-option value="pothole">Nid-de-poule</ion-select-option>
                  <ion-select-option value="roadwork">Travaux en cours</ion-select-option>
                  <ion-select-option value="lighting">Éclairage défectueux</ion-select-option>
                  <ion-select-option value="waste">Déchets sur voie</ion-select-option>
                  <ion-select-option value="traffic_light">Feu tricolore HS</ion-select-option>
                  <ion-select-option value="signage">Signalisation manquante</ion-select-option>
                  <ion-select-option value="flooding">Inondation</ion-select-option>
                  <ion-select-option value="other">Autre</ion-select-option>
                </ion-select>
              </div>

              <!-- Filtre par date -->
              <div class="filter-section">
                <h4>Période</h4>
                <ion-segment
                  v-model="filters.dateRange"
                  @ion-change="updateFilters"
                  class="date-filter"
                >
                  <ion-segment-button value="all">
                    <ion-label>Toutes</ion-label>
                  </ion-segment-button>
                  <ion-segment-button value="week">
                    <ion-label>Cette semaine</ion-label>
                  </ion-segment-button>
                  <ion-segment-button value="month">
                    <ion-label>Ce mois</ion-label>
                  </ion-segment-button>
                  <ion-segment-button value="year">
                    <ion-label>Cette année</ion-label>
                  </ion-segment-button>
                </ion-segment>
              </div>

              <!-- Mes signalements uniquement -->
              <div class="filter-section">
                <ion-item lines="none" class="my-reports-filter">
                  <ion-icon name="person" slot="start" color="primary"></ion-icon>
                  <ion-label>Mes signalements uniquement</ion-label>
                  <ion-toggle
                    v-model="filters.myReportsOnly"
                    @ion-change="updateFilters"
                    slot="end"
                  ></ion-toggle>
                </ion-item>
              </div>

              <!-- Boutons d'action -->
              <div class="filter-actions">
                <ion-button
                  fill="outline"
                  @click="resetFilters"
                  class="reset-button"
                >
                  <ion-icon name="refresh" slot="start"></ion-icon>
                  Réinitialiser
                </ion-button>
                <ion-button @click="applyFilters" class="apply-button">
                  <ion-icon name="checkmark" slot="start"></ion-icon>
                  Appliquer
                </ion-button>
              </div>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </div>

      <!-- Résultats de recherche -->
      <div class="search-results">
        <div v-if="isSearching" class="loading-state">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Recherche en cours...</p>
        </div>

        <div v-else-if="searchQuery && results.length === 0" class="empty-state">
          <ion-icon name="search" size="large" color="medium"></ion-icon>
          <h3>Aucun résultat</h3>
          <p>Aucun signalement ne correspond à votre recherche.</p>
          <ion-button fill="clear" @click="clearSearch">
            Effacer la recherche
          </ion-button>
        </div>

        <div v-else-if="results.length > 0" class="results-list">
          <div class="results-header">
            <h3>{{ results.length }} résultat{{ results.length > 1 ? 's' : '' }} trouvé{{ results.length > 1 ? 's' : '' }}</h3>
            <ion-button
              fill="clear"
              size="small"
              @click="toggleViewMode"
              class="view-toggle"
            >
              <ion-icon :name="viewMode === 'list' ? 'map' : 'list'" slot="start"></ion-icon>
              {{ viewMode === 'list' ? 'Carte' : 'Liste' }}
            </ion-button>
          </div>

          <!-- Vue liste -->
          <div v-if="viewMode === 'list'" class="list-view">
            <ion-list class="results-ion-list">
              <ion-item
                v-for="report in results"
                :key="report.id"
                class="result-item"
                @click="viewReport(report)"
                button
              >
                <ion-thumbnail slot="start" class="result-thumbnail">
                  <img
                    v-if="report.photos && report.photos.length > 0"
                    :src="report.photos[0]"
                    :alt="'Photo de ' + report.title"
                    class="result-image"
                  />
                  <div v-else class="no-image">
                    <ion-icon name="image" color="medium"></ion-icon>
                  </div>
                </ion-thumbnail>

                <ion-label class="result-label">
                  <h2 class="result-title">{{ report.title }}</h2>
                  <p class="result-type">
                    <span class="type-icon">{{ getReportTypeIcon(report) }}</span>
                    <span class="type-label">{{ getReportTypeLabel(report) }}</span>
                  </p>
                  <p class="result-description">{{ truncateText(report.description, 80) }}</p>
                  <p class="result-address">
                    <ion-icon name="location" size="small"></ion-icon>
                    {{ report.address }}
                  </p>
                  <p class="result-meta">
                    <ion-badge :color="getStatusColor(report.status)" size="small">
                      {{ getStatusLabel(report.status) }}
                    </ion-badge>
                    <span class="result-date">{{ formatDate(report.createdAt) }}</span>
                  </p>
                </ion-label>

                <ion-icon name="chevron-forward" slot="end" color="medium"></ion-icon>
              </ion-item>
            </ion-list>
          </div>

          <!-- Vue carte -->
          <div v-else class="map-view">
            <div ref="resultsMap" class="results-map-container"></div>
          </div>
        </div>

        <!-- Suggestions si pas de recherche -->
        <div v-else-if="!searchQuery" class="suggestions">
          <h3>Recherches populaires</h3>
          <div class="suggestion-tags">
            <ion-chip
              v-for="suggestion in popularSearches"
              :key="suggestion"
              @click="searchSuggestion(suggestion)"
              class="suggestion-chip"
            >
              <ion-label>{{ suggestion }}</ion-label>
            </ion-chip>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- FAB pour basculer les filtres -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="toggleAdvancedFilters">
        <ion-icon name="filter"></ion-icon>
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
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonList,
  IonThumbnail,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonChip,
  toastController
} from '@ionic/vue'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useReportsStore } from '@/stores/reports.store'
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/utils/constants'
import L from 'leaflet'

// État réactif
const router = useRouter()
const reportsStore = useReportsStore()

const searchInput = ref(null)
const resultsMap = ref(null)
let resultsMapInstance = null

const searchQuery = ref('')
const isSearching = ref(false)
const searchTimeout = ref(null)
const showAdvancedFilters = ref(false)
const viewMode = ref('list') // 'list' ou 'map'

const filters = ref({
  status: 'all',
  category: 'all',
  dateRange: 'all',
  myReportsOnly: false
})

const popularSearches = [
  'nid-de-poule',
  'éclairage',
  'travaux',
  'déchets',
  'inondation',
  'feu tricolore',
  'signalisation'
]

// Getters calculés
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.status !== 'all') count++
  if (filters.value.category !== 'all') count++
  if (filters.value.dateRange !== 'all') count++
  if (filters.value.myReportsOnly) count++
  return count
})

const results = computed(() => {
  let filtered = [...reportsStore.reports]

  // Filtre de recherche textuelle
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(report =>
      report.title.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      report.address.toLowerCase().includes(query) ||
      getStatusLabel(report.status).toLowerCase().includes(query) ||
      getCategoryLabel(report.category).toLowerCase().includes(query)
    )
  }

  // Appliquer les filtres avancés
  if (filters.value.status !== 'all') {
    filtered = filtered.filter(report => report.status === filters.value.status)
  }

  if (filters.value.category !== 'all') {
    filtered = filtered.filter(report => report.category === filters.value.category)
  }

  if (filters.value.dateRange !== 'all') {
    const now = new Date()
    let startDate

    switch (filters.value.dateRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    if (startDate) {
      filtered = filtered.filter(report =>
        new Date(report.createdAt) >= startDate
      )
    }
  }

  if (filters.value.myReportsOnly) {
    // Simulation : filtrer par userId mock
    filtered = filtered.filter(report => report.createdBy === '1')
  }

  return filtered
})

// Méthodes
const onSearchInput = () => {
  clearTimeout(searchTimeout.value)
  isSearching.value = true

  searchTimeout.value = setTimeout(() => {
    isSearching.value = false
    updateResults()
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  updateResults()
}

const updateResults = () => {
  // Les résultats sont automatiquement mis à jour via computed
  if (viewMode.value === 'map') {
    updateMapMarkers()
  }
}

const toggleAdvancedFilters = () => {
  showAdvancedFilters.value = !showAdvancedFilters.value
}

const updateFilters = () => {
  updateResults()
}

const applyFilters = () => {
  updateResults()
  showAdvancedFilters.value = false
}

const resetFilters = () => {
  filters.value = {
    status: 'all',
    category: 'all',
    dateRange: 'all',
    myReportsOnly: false
  }
  updateResults()
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'map' : 'list'
}

const initializeResultsMap = () => {
  if (!resultsMap.value || resultsMapInstance) return

  // Configuration de Leaflet
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })

  resultsMapInstance = L.map(resultsMap.value, {
    center: [-18.8792, 47.5079],
    zoom: 12,
    zoomControl: true,
    attributionControl: true
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(resultsMapInstance)

  updateMapMarkers()
}

const updateMapMarkers = () => {
  if (!resultsMapInstance) return

  // Nettoyer les anciens marqueurs
  resultsMapInstance.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      resultsMapInstance.removeLayer(layer)
    }
  })

  // Ajouter les nouveaux marqueurs
  results.value.forEach(report => {
    const marker = L.marker([report.latitude, report.longitude])

    // Popup
    const popupContent = `
      <div style="min-width: 200px;">
        <h4>${report.title}</h4>
        <p>${report.address}</p>
        <button onclick="window.viewReportFromSearch('${report.id}')" style="background: var(--ion-color-primary); color: var(--ion-text-color); border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Voir détails
        </button>
      </div>
    `

    marker.bindPopup(popupContent)
    marker.addTo(resultsMapInstance)
  })

  // Ajuster la vue pour montrer tous les marqueurs
  if (results.value.length > 0) {
    const group = new L.featureGroup(results.value.map(r =>
      L.marker([r.latitude, r.longitude])
    ))
    resultsMapInstance.fitBounds(group.getBounds(), { padding: [20, 20] })
  }
}

// Fonction globale pour les popups de carte
window.viewReportFromSearch = (reportId) => {
  const report = reportsStore.reports.find(r => r.id === reportId)
  if (report) {
    viewReport(report)
  }
}

const viewReport = (report) => {
  reportsStore.setCurrentReport(report)
  router.push('/map')
}

const searchSuggestion = (suggestion) => {
  searchQuery.value = suggestion
  onSearchInput()
}

const getStatusColor = (status) => {
  const colors = {
    new: 'danger',
    in_progress: 'warning',
    completed: 'success'
  }
  return colors[status] || 'primary'
}

const getStatusLabel = (status) => {
  return REPORT_STATUS_LABELS[status] || status
}

const getCategoryLabel = (category) => {
  const labels = {
    pothole: 'Nid-de-poule',
    roadwork: 'Travaux en cours',
    lighting: 'Éclairage défectueux',
    waste: 'Déchets sur voie',
    traffic_light: 'Feu tricolore HS',
    signage: 'Signalisation manquante',
    flooding: 'Inondation',
    other: 'Autre'
  }
  return labels[category] || category
}

const getReportTypeLabel = (report) => {
  const category = report?.category || report?.typeLabel || report?.type?.libelle
  const labels = {
    pothole: 'Nid-de-poule',
    roadwork: 'Travaux en cours',
    lighting: 'Éclairage défectueux',
    waste: 'Déchets sur voie',
    traffic_light: 'Feu tricolore HS',
    signage: 'Signalisation manquante',
    flooding: 'Inondation',
    other: 'Autre'
  }

  if (labels[category]) return labels[category]
  if (typeof category === 'string' && category.trim()) return category
  return 'Autre'
}

const getReportTypeIcon = (report) => {
  const category = (report?.category || report?.typeLabel || report?.type?.libelle || '').toLowerCase()
  if (category.includes('nid') || category.includes('pothole')) return '🕳️'
  if (category.includes('travaux') || category.includes('roadwork')) return '🚧'
  if (category.includes('éclairage') || category.includes('lighting')) return '💡'
  if (category.includes('déchets') || category.includes('waste')) return '🗑️'
  if (category.includes('feu') || category.includes('traffic')) return '🚦'
  if (category.includes('signalisation') || category.includes('signage')) return '🪧'
  if (category.includes('inondation') || category.includes('flood')) return '🌊'
  return '⚠️'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
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

// Watchers
watch(searchQuery, updateResults)
watch(viewMode, (mode) => {
  if (mode === 'map') {
    nextTick(() => {
      initializeResultsMap()
    })
  } else if (resultsMapInstance) {
    resultsMapInstance.remove()
    resultsMapInstance = null
  }
})

// Cycle de vie
onMounted(async () => {
  // Charger les données
  await reportsStore.fetchReports()

  // Focus sur la barre de recherche
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.$el.focus()
    }
  })
})

onUnmounted(() => {
  if (resultsMapInstance) {
    resultsMapInstance.remove()
    resultsMapInstance = null
  }
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})
</script>

<style scoped>
/* 🎨 Theme adaptatif - Mode clair par défaut, sombre au toggle */
.search-toolbar {
  --background: var(--app-background);
  --border-width: 0 0 1px 0;
  border-bottom-color: var(--app-border);
}

.main-search {
  --background: var(--app-surface);
  --border-radius: 10px;
  --padding-start: 12px;
  --padding-end: 12px;
  border: 1px solid var(--app-border);
}

.search-content {
  --padding-top: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-bottom: 16px;
}

.advanced-filters {
  border-bottom: 1px solid var(--app-border);
  background: var(--app-background);
}

.accordion-header {
  --background: var(--app-surface);
  --color: var(--ion-text-color);
}

.accordion-content {
  padding: 16px;
  background: var(--app-background);
}

.filter-section {
  margin-bottom: 20px;
}

.filter-section h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--ion-text-color);
}

.status-filter,
.date-filter {
  --background: transparent;
}

.category-filter {
  width: 100%;
  --background: var(--app-surface);
  --color: var(--ion-text-color);
}

.my-reports-filter {
  --border-radius: 8px;
  --background: var(--app-surface);
}

.result-item {
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  margin: 8px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  --background: var(--app-surface);
  border-left: 4px solid var(--ion-color-primary);
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--ion-color-primary);
  line-height: 1.3;
}

.result-description {
  font-size: 13px;
  color: var(--ion-text-color);
  opacity: 0.85;
  margin: 0 0 6px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-type {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 6px 0;
  font-size: 13px;
  color: var(--ion-text-color);
  font-weight: 600;
}

.result-type .type-icon {
  font-size: 15px;
}

.result-type .type-label {
  color: var(--ion-text-color);
}

.result-address {
  font-size: 13px;
  color: var(--ion-text-color);
  opacity: 0.85;
  margin: 0 0 6px 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.result-date {
  font-size: 12px;
  color: var(--ion-text-color);
  opacity: 0.7;
  font-weight: 600;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 16px 16px;
  border-bottom: 1px solid var(--app-border);
}

.results-header h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: var(--ion-text-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--ion-text-color);
}

.empty-state p {
  color: var(--ion-text-color);
  opacity: 0.8;
  margin: 8px 0 16px 0;
}

.suggestions h3 {
  font-size: 19px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: var(--ion-text-color);
}

.suggestion-chip {
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 40px;
  --background: var(--app-surface);
  --color: var(--ion-text-color);
  border: 1px solid var(--app-border);
}

.suggestion-chip:hover {
  transform: translateY(-2px);
  --background: #ffc107;
  --color: var(--app-text-primary);
}

/* Responsive */
@media (max-width: 480px) {
  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .results-header h3 {
    font-size: 16px;
  }

  .map-view {
    margin: 12px;
    height: calc(100vh - 150px);
    border-radius: 12px;
  }
}
</style>
