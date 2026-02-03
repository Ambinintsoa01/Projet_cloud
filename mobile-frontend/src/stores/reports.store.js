import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth.store'
import { apiService } from '@/services/api.service'
import { storageService } from '@/services/storage.service'
import { useSignalements } from '@/composables/useSignalements'

export const useReportsStore = defineStore('reports', () => {
  // État
  const reports = ref([])
  const filters = ref({
    status: 'all', // all, new, in_progress, completed, mine
    category: 'all',
    search: ''
  })
  const isLoading = ref(false)
  const currentReport = ref(null)

  // Getters
  const filteredReports = computed(() => {
    let filtered = [...reports.value]

    // Filtre par statut
    if (filters.value.status !== 'all') {
      if (filters.value.status === 'mine') {
        const authStore = useAuthStore()
        filtered = filtered.filter(report => {
          const userId = report.userId || report.user?.id || report.createdBy
          return userId === authStore.user?.id
        })
      } else {
        filtered = filtered.filter(report => report.status === filters.value.status)
      }
    }

    // Filtre par catégorie
    if (filters.value.category !== 'all') {
      filtered = filtered.filter(report => {
        const typeLabel = report.type?.libelle || report.typeLabel || report.category
        return typeLabel === filters.value.category
      })
    }

    // Filtre par recherche
    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase()
      filtered = filtered.filter(report => {
        const title = report.title || report.type?.libelle || report.description || ''
        const description = report.description || ''
        const address = report.address || ''
        return title.toLowerCase().includes(searchTerm) ||
               description.toLowerCase().includes(searchTerm) ||
               address.toLowerCase().includes(searchTerm)
      })
    }

    return filtered
  })

  const myReports = computed(() => {
    const authStore = useAuthStore()
    return reports.value.filter(report => report.createdBy === authStore.user?.id)
  })

  const reportsStats = computed(() => {
    const total = reports.value.length
    const newReports = reports.value.filter(r => r.status === 'new').length
    const inProgress = reports.value.filter(r => r.status === 'in_progress').length
    const completed = reports.value.filter(r => r.status === 'completed').length
    const myReportsCount = myReports.value.length

    return {
      total,
      new: newReports,
      inProgress,
      completed,
      mine: myReportsCount
    }
  })

  // Actions
  async function fetchReports() {
    isLoading.value = true

    try {
      console.log('🔄 fetchReports: Début...')
      const hasToken = !!storageService.getAuthToken()
      const data = await apiService.getAllSignalements({
        preferFirebase: !hasToken,
        syncOnOnline: true
      })

      console.log('📥 API getAllSignalements retourné:', {
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
        type: typeof data,
        sample: Array.isArray(data) && data.length > 0 ? data[0] : null
      })

      reports.value = Array.isArray(data) ? data : []
      storageService.setReportsData(reports.value)

      console.log(`✅ fetchReports: ${reports.value.length} signalements stockés`)
      return { success: true }
    } catch (error) {
      console.error('❌ fetchReports: Erreur lors du chargement des rapports:', error)

      // Si online, fallback direct Firestore
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
      if (isOnline) {
        console.log('🔄 Tentative fallback Firestore...')
        try {
          const { getAllSignalements } = useSignalements()
          const firebaseData = await getAllSignalements()
          console.log('📥 Firestore retourné:', {
            isArray: Array.isArray(firebaseData),
            length: Array.isArray(firebaseData) ? firebaseData.length : 'N/A'
          })
          reports.value = Array.isArray(firebaseData) ? firebaseData : []
          storageService.setReportsData(reports.value)
          console.log(`✅ ${reports.value.length} signalements depuis Firestore`)
          return { success: true, fromFirebase: true }
        } catch (firebaseError) {
          console.error('❌ Erreur Firestore:', firebaseError)
        }
      }

      // Fallback cache local si disponible
      const cached = storageService.getReportsData()
      reports.value = Array.isArray(cached) ? cached : []

      if (reports.value.length === 0) {
        throw error
      }

      return { success: true, fromCache: true }
    } finally {
      isLoading.value = false
    }
  }

  async function createReport(reportData) {
    isLoading.value = true

    try {
      // Simulation d'appel API avec délai
      await new Promise(resolve => setTimeout(resolve, 3000))

      const authStore = useAuthStore()
      const newReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...reportData,
        status: 'new',
        createdBy: authStore.user?.id || 'anonymous',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAnonymous: reportData.isAnonymous || false
      }

      // Ajouter à la liste
      reports.value.unshift(newReport)

      // Sauvegarder dans le cache local
      storageService.setReportsData(reports.value)

      return { success: true, report: newReport }
    } catch (error) {
      console.error('Erreur lors de la création du rapport:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function updateReport(reportId, updates) {
    isLoading.value = true

    try {
      // Simulation d'appel API avec délai
      await new Promise(resolve => setTimeout(resolve, 1000))

      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex === -1) {
        throw new Error('Rapport non trouvé')
      }

      // Mettre à jour le rapport
      reports.value[reportIndex] = {
        ...reports.value[reportIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      // Sauvegarder dans le cache local
      storageService.setReportsData(reports.value)

      return { success: true, report: reports.value[reportIndex] }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rapport:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function setCurrentReport(report) {
    currentReport.value = report
  }

  // Fonction utilitaire pour générer des données mock
  function getMockReports() {
    const authStore = useAuthStore()
    const userId = authStore.user?.id || '1'

    return [
      {
        id: 'report_001',
        title: 'Nid-de-poule dangereux Rue Indira Gandhi',
        description: 'Un nid-de-poule très profond au milieu de la chaussée représente un danger pour les véhicules et les motos.',
        latitude: -18.8792,
        longitude: 47.5079,
        address: 'Rue Indira Gandhi, Antananarivo',
        category: 'pothole',
        status: 'new',
        photos: ['/assets/images/pothole1.jpg', '/assets/images/pothole2.jpg'],
        createdBy: userId,
        createdAt: '2025-01-25T08:30:00Z',
        updatedAt: '2025-01-25T08:30:00Z',
        isAnonymous: false
      },
      {
        id: 'report_002',
        title: 'Travaux en cours Boulevard de l\'Indépendance',
        description: 'Des travaux de voirie bloquent complètement la circulation depuis 3 jours sans signalisation adéquate.',
        latitude: -18.8810,
        longitude: 47.5100,
        address: 'Boulevard de l\'Indépendance, Antananarivo',
        category: 'roadwork',
        status: 'in_progress',
        photos: ['/assets/images/roadwork1.jpg'],
        createdBy: 'user_002',
        createdAt: '2025-01-24T14:20:00Z',
        updatedAt: '2025-01-25T09:15:00Z',
        isAnonymous: true
      },
      {
        id: 'report_003',
        title: 'Éclairage défectueux Place du 13 Mai',
        description: 'Plusieurs lampadaires ne fonctionnent plus depuis une semaine, créant une zone sombre dangereuse.',
        latitude: -18.8785,
        longitude: 47.5092,
        address: 'Place du 13 Mai, Antananarivo',
        category: 'lighting',
        status: 'completed',
        photos: ['/assets/images/lighting1.jpg', '/assets/images/lighting2.jpg', '/assets/images/lighting3.jpg'],
        createdBy: 'user_003',
        createdAt: '2025-01-20T16:45:00Z',
        updatedAt: '2025-01-23T11:30:00Z',
        isAnonymous: false
      },
      {
        id: 'report_004',
        title: 'Déchets accumulés Avenue de l\'Indépendance',
        description: 'Des ordures s\'accumulent depuis plusieurs jours à cause de la grève des éboueurs.',
        latitude: -18.8820,
        longitude: 47.5085,
        address: 'Avenue de l\'Indépendance, Antananarivo',
        category: 'waste',
        status: 'new',
        photos: [],
        createdBy: 'user_004',
        createdAt: '2025-01-25T12:00:00Z',
        updatedAt: '2025-01-25T12:00:00Z',
        isAnonymous: true
      },
      {
        id: 'report_005',
        title: 'Feu tricolore hors service Carrefour Analakely',
        description: 'Le feu de signalisation au carrefour Analakely ne fonctionne plus, causant des embouteillages importants.',
        latitude: -18.9050,
        longitude: 47.5250,
        address: 'Carrefour Analakely, Antananarivo',
        category: 'traffic_light',
        status: 'in_progress',
        photos: ['/assets/images/traffic_light1.jpg'],
        createdBy: userId,
        createdAt: '2025-01-22T07:15:00Z',
        updatedAt: '2025-01-24T13:45:00Z',
        isAnonymous: false
      },
      {
        id: 'report_006',
        title: 'Signalisation manquante Rue Pasteur',
        description: 'Absence totale de panneaux de signalisation dans une rue étroite avec beaucoup de circulation.',
        latitude: -18.8870,
        longitude: 47.5120,
        address: 'Rue Pasteur, Antananarivo',
        category: 'signage',
        status: 'completed',
        photos: ['/assets/images/signage1.jpg', '/assets/images/signage2.jpg'],
        createdBy: 'user_005',
        createdAt: '2025-01-18T09:30:00Z',
        updatedAt: '2025-01-22T15:20:00Z',
        isAnonymous: false
      },
      {
        id: 'report_007',
        title: 'Inondation récurrente Rue Ratsimilaho',
        description: 'Formation de flaques d\'eau importantes après chaque pluie à cause d\'un problème de drainage.',
        latitude: -18.8835,
        longitude: 47.5145,
        address: 'Rue Ratsimilaho, Antananarivo',
        category: 'flooding',
        status: 'new',
        photos: [],
        createdBy: 'user_006',
        createdAt: '2025-01-25T10:45:00Z',
        updatedAt: '2025-01-25T10:45:00Z',
        isAnonymous: true
      },
      {
        id: 'report_008',
        title: 'Problème de voirie divers Rue Andriantsihorisoa',
        description: 'Différents problèmes de voirie nécessitant une intervention rapide des services municipaux.',
        latitude: -18.8900,
        longitude: 47.5180,
        address: 'Rue Andriantsihorisoa, Antananarivo',
        category: 'other',
        status: 'in_progress',
        photos: ['/assets/images/other1.jpg'],
        createdBy: userId,
        createdAt: '2025-01-23T11:20:00Z',
        updatedAt: '2025-01-25T08:00:00Z',
        isAnonymous: false
      }
    ]
  }

  return {
    // État
    reports,
    filters,
    isLoading,
    currentReport,

    // Getters
    filteredReports,
    myReports,
    reportsStats,

    // Actions
    fetchReports,
    createReport,
    updateReport,
    setFilters,
    setCurrentReport
  }
})
