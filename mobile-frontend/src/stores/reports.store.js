import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth.store'
import { storageService } from '@/services/storage.service'
import { useSignalements } from '@/composables/useSignalements'
import { auth } from '@/services/firebase.service'

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

  // Utiliser le composable Firestore
  const { 
    getAllSignalements, 
    createSignalement, 
    updateSignalement 
  } = useSignalements()

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

  // Actions - Utiliser uniquement Firebase Firestore
  async function fetchReports() {
    isLoading.value = true

    try {
      console.log('🔄 fetchReports: Chargement depuis Firestore...')
      
      // Récupération directe depuis Firestore
      const data = await getAllSignalements()

      console.log('📥 Firestore getAllSignalements retourné:', {
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
        sample: Array.isArray(data) && data.length > 0 ? data[0] : null
      })

      reports.value = Array.isArray(data) ? data : []
      
      // Sauvegarder dans le cache local pour consultation offline
      if (reports.value.length > 0) {
        storageService.setReportsData(reports.value)
        console.log(`✅ fetchReports: ${reports.value.length} signalements chargés depuis Firestore`)
      } else {
        console.log('⚠️ Aucun signalement disponible')
        // Essayer de charger depuis le cache
        const cached = storageService.getReportsData()
        if (Array.isArray(cached) && cached.length > 0) {
          reports.value = cached
          console.log(`📦 ${reports.value.length} signalements chargés depuis le cache`)
        }
      }

      return { success: true, fromFirebase: true }
    } catch (error) {
      console.error('❌ fetchReports: Erreur lors du chargement depuis Firestore:', error)

      // Fallback sur le cache local si disponible
      const cached = storageService.getReportsData()
      reports.value = Array.isArray(cached) ? cached : []

      console.log(`📦 ${reports.value.length} signalements chargés depuis le cache`)
      
      // Ne pas throw d'erreur, juste retourner le résultat
      return { 
        success: reports.value.length > 0, 
        fromCache: true,
        error: error.message 
      }
    } finally {
      isLoading.value = false
    }
  }

  async function createReport(reportData) {
    isLoading.value = true

    try {
      console.log('🔄 createReport: Création du signalement dans Firestore...')
      
      const authStore = useAuthStore()
      const userId = auth.currentUser?.uid || authStore.user?.id || 'anonymous'

      // Créer le signalement directement dans Firestore
      const newReportData = {
        description: reportData.description,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        typeId: reportData.typeId || reportData.type || reportData.category,
        photos: reportData.photos || reportData.imageUrls || [],
        userId: userId,
        status: reportData.status || 'new',
        isAnonymous: reportData.isAnonymous || false,
        address: reportData.address || '',
        createdAt: new Date()
      }

      const createdReport = await createSignalement(newReportData)

      console.log('✅ Signalement créé dans Firestore:', createdReport.id)

      // Ajouter à la liste locale
      reports.value.unshift(createdReport)

      // Sauvegarder dans le cache local
      storageService.setReportsData(reports.value)

      return { success: true, report: createdReport }
    } catch (error) {
      console.error('❌ Erreur lors de la création du rapport:', error)
      throw new Error('Impossible de créer le signalement. Vérifiez votre connexion.')
    } finally {
      isLoading.value = false
    }
  }

  function addReport(report) {
    console.log('➕ Ajout signalement au store:', report)
    reports.value.unshift(report) // Ajoute au début
    console.log('📊 Total signalements après ajout:', reports.value.length)
  }

  async function updateReport(reportId, updates) {
    isLoading.value = true

    try {
      console.log('🔄 updateReport: Mise à jour du signalement dans Firestore...')

      // Mettre à jour dans Firestore
      await updateSignalement(reportId, updates)

      console.log('✅ Signalement mis à jour dans Firestore:', reportId)

      // Mettre à jour dans la liste locale
      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex !== -1) {
        reports.value[reportIndex] = {
          ...reports.value[reportIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        }

        // Sauvegarder dans le cache local
        storageService.setReportsData(reports.value)

        return { success: true, report: reports.value[reportIndex] }
      } else {
        throw new Error('Rapport non trouvé localement')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du rapport:', error)
      throw new Error('Impossible de mettre à jour le signalement.')
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
    addReport,
    createReport,
    updateReport,
    setFilters,
    setCurrentReport
  }
})

