import { ref, computed, watch } from 'vue'
import { storageService } from '@/services/storage.service'

// Composable pour gérer le stockage hors ligne
export function useOfflineStorage() {
  // État réactif
  const isOnline = ref(navigator.onLine)
  const isLoading = ref(false)
  const error = ref(null)
  const pendingSyncCount = ref(0)

  // Getters calculés
  const offlineQueue = computed(() => storageService.getOfflineQueue())
  const hasPendingSync = computed(() => offlineQueue.value.length > 0)
  const storageStats = computed(() => storageService.getStorageStats())

  // Méthodes
  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
  }

  const addToSyncQueue = async (action) => {
    try {
      if (!isOnline.value) {
        // Ajouter à la file d'attente hors ligne
        storageService.addToOfflineQueue(action)
        pendingSyncCount.value = offlineQueue.value.length + 1
        return {
          success: true,
          queued: true,
          message: 'Action mise en file d\'attente (hors ligne)'
        }
      } else {
        // Exécuter immédiatement
        return await executeAction(action)
      }
    } catch (err) {
      error.value = err.message
      console.error('Erreur lors de l\'ajout à la file:', err)
      return {
        success: false,
        error: err.message
      }
    }
  }

  const executeAction = async (action) => {
    // Simulation d'exécution d'action
    await new Promise(resolve => setTimeout(resolve, 500))

    // Ici on pourrait appeler l'API appropriée selon le type d'action
    switch (action.type) {
      case 'CREATE_REPORT':
        console.log('📤 Création de signalement:', action.payload)
        break
      case 'UPDATE_REPORT':
        console.log('📤 Mise à jour de signalement:', action.payload)
        break
      case 'UPLOAD_PHOTO':
        console.log('📤 Upload de photo:', action.payload)
        break
      default:
        console.log('📤 Action inconnue:', action)
    }

    return {
      success: true,
      executed: true,
      message: 'Action exécutée avec succès'
    }
  }

  const syncOfflineData = async () => {
    if (!isOnline.value) {
      error.value = 'Pas de connexion internet'
      return { success: false, error: 'Pas de connexion internet' }
    }

    isLoading.value = true
    error.value = null

    try {
      const queue = [...offlineQueue.value]
      const results = []

      for (const action of queue) {
        try {
          const result = await executeAction(action)
          results.push({ action: action.id, success: true, result })

          // Retirer de la file après succès
          storageService.removeFromOfflineQueue(action.id)
        } catch (err) {
          results.push({ action: action.id, success: false, error: err.message })
          console.error(`Erreur lors de la synchro de ${action.id}:`, err)
        }
      }

      pendingSyncCount.value = offlineQueue.value.length - queue.length

      return {
        success: true,
        synced: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        total: queue.length,
        results
      }

    } catch (err) {
      error.value = err.message || 'Erreur lors de la synchronisation'
      return {
        success: false,
        error: error.value
      }
    } finally {
      isLoading.value = false
    }
  }

  const clearOfflineQueue = () => {
    storageService.clearOfflineQueue()
    pendingSyncCount.value = 0
  }

  const getStoredReports = () => {
    return storageService.getReportsData()
  }

  const saveReportsLocally = (reports) => {
    return storageService.setReportsData(reports)
  }

  const getUserPreferences = () => {
    return storageService.getUserPreferences()
  }

  const saveUserPreferences = (preferences) => {
    return storageService.setUserPreferences(preferences)
  }

  const cleanupStorage = (maxAge = 30 * 24 * 60 * 60 * 1000) => {
    return storageService.cleanup(maxAge)
  }

  const exportData = () => {
    try {
      const data = {
        reports: storageService.getReportsData(),
        preferences: storageService.getUserPreferences(),
        settings: storageService.getAppSettings(),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `signalement_backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      return { success: true, message: 'Données exportées avec succès' }
    } catch (err) {
      error.value = 'Erreur lors de l\'export'
      return { success: false, error: err.message }
    }
  }

  const importData = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)

          if (data.reports) {
            storageService.setReportsData(data.reports)
          }
          if (data.preferences) {
            storageService.setUserPreferences(data.preferences)
          }
          if (data.settings) {
            storageService.setAppSettings(data.settings)
          }

          resolve({
            success: true,
            message: 'Données importées avec succès',
            imported: {
              reports: data.reports?.length || 0,
              preferences: !!data.preferences,
              settings: !!data.settings
            }
          })
        } catch (err) {
          resolve({
            success: false,
            error: 'Fichier JSON invalide'
          })
        }
      }
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Erreur lors de la lecture du fichier'
        })
      }
      reader.readAsText(file)
    })
  }

  // Écouter les changements de statut réseau
  const handleOnline = () => {
    isOnline.value = true
  }

  const handleOffline = () => {
    isOnline.value = false
  }

  // Watch pour mettre à jour le compteur de sync en attente
  watch(offlineQueue, (newQueue) => {
    pendingSyncCount.value = newQueue.length
  }, { immediate: true })

  // Initialisation des listeners réseau
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Cleanup
  const cleanup = () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }

  return {
    // État
    isOnline,
    isLoading,
    error,
    pendingSyncCount,

    // Getters
    offlineQueue,
    hasPendingSync,
    storageStats,

    // Méthodes
    addToSyncQueue,
    syncOfflineData,
    clearOfflineQueue,
    getStoredReports,
    saveReportsLocally,
    getUserPreferences,
    saveUserPreferences,
    cleanupStorage,
    exportData,
    importData,
    cleanup
  }
}
