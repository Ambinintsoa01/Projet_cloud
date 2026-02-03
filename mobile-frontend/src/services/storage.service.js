// Service de stockage pour gérer le localStorage de manière centralisée
export class StorageService {
  // Clés de stockage
  static KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    REPORTS_DATA: 'reports_data',
    USER_PREFERENCES: 'user_preferences',
    APP_SETTINGS: 'app_settings',
    OFFLINE_QUEUE: 'offline_queue'
  }

  // Méthodes génériques
  static get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${key}:`, error)
      return defaultValue
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${key}:`, error)
      return false
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error)
      return false
    }
  }

  static clear() {
    try {
      // Ne supprimer que les clés de l'application, pas tout le localStorage
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      return true
    } catch (error) {
      console.error('Erreur lors du nettoyage du stockage:', error)
      return false
    }
  }

  static exists(key) {
    return localStorage.getItem(key) !== null
  }

  // Méthodes spécifiques à l'authentification
  static getAuthToken() {
    return localStorage.getItem(this.KEYS.AUTH_TOKEN)
  }

  static setAuthToken(token) {
    localStorage.setItem(this.KEYS.AUTH_TOKEN, token)
  }

  static removeAuthToken() {
    localStorage.removeItem(this.KEYS.AUTH_TOKEN)
  }

  static getUserData() {
    return this.get(this.KEYS.USER_DATA, null)
  }

  static setUserData(userData) {
    return this.set(this.KEYS.USER_DATA, userData)
  }

  static removeUserData() {
    return this.remove(this.KEYS.USER_DATA)
  }

  // Méthodes spécifiques aux rapports
  static getReportsData() {
    return this.get(this.KEYS.REPORTS_DATA, [])
  }

  static setReportsData(reports) {
    return this.set(this.KEYS.REPORTS_DATA, reports)
  }

  // Méthodes spécifiques aux préférences utilisateur
  static getUserPreferences() {
    return this.get(this.KEYS.USER_PREFERENCES, {
      darkMode: false,
      theme: 'light',
      language: 'fr',
      notifications: true,
      offlineMode: false,
      myReportsOnly: false
    })
  }

  static setUserPreferences(preferences) {
    const currentPrefs = this.getUserPreferences()
    const newPrefs = { ...currentPrefs, ...preferences }
    return this.set(this.KEYS.USER_PREFERENCES, newPrefs)
  }

  static updateUserPreference(key, value) {
    const preferences = this.getUserPreferences()
    preferences[key] = value
    return this.set(this.KEYS.USER_PREFERENCES, preferences)
  }

  // Méthodes spécifiques aux paramètres de l'application
  static getAppSettings() {
    return this.get(this.KEYS.APP_SETTINGS, {
      firstLaunch: true,
      lastSync: null,
      version: '1.0.0'
    })
  }

  static setAppSettings(settings) {
    const currentSettings = this.getAppSettings()
    const newSettings = { ...currentSettings, ...settings }
    return this.set(this.KEYS.APP_SETTINGS, newSettings)
  }

  // File d'attente hors ligne (pour synchronisation future)
  static getOfflineQueue() {
    return this.get(this.KEYS.OFFLINE_QUEUE, [])
  }

  static addToOfflineQueue(action) {
    const queue = this.getOfflineQueue()
    queue.push({
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      timestamp: new Date().toISOString(),
      retryCount: 0
    })
    return this.set(this.KEYS.OFFLINE_QUEUE, queue)
  }

  static removeFromOfflineQueue(actionId) {
    const queue = this.getOfflineQueue()
    const filteredQueue = queue.filter(item => item.id !== actionId)
    return this.set(this.KEYS.OFFLINE_QUEUE, filteredQueue)
  }

  static clearOfflineQueue() {
    return this.set(this.KEYS.OFFLINE_QUEUE, [])
  }

  // Statistiques de stockage
  static getStorageStats() {
    const stats = {
      totalKeys: 0,
      appKeys: 0,
      totalSize: 0,
      appSize: 0
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const value = localStorage.getItem(key)
      const size = (key.length + value.length) * 2 // Approximation en bytes

      stats.totalKeys++
      stats.totalSize += size

      if (Object.values(this.KEYS).includes(key)) {
        stats.appKeys++
        stats.appSize += size
      }
    }

    return stats
  }

  // Nettoyage intelligent (supprimer les données anciennes)
  static cleanup(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 jours par défaut
    try {
      const reports = this.getReportsData()
      const now = new Date()

      // Filtrer les rapports trop anciens (simulation)
      const filteredReports = reports.filter(report => {
        const reportDate = new Date(report.createdAt)
        return (now - reportDate) < maxAge
      })

      if (filteredReports.length !== reports.length) {
        this.setReportsData(filteredReports)
        console.log(`Nettoyage: ${reports.length - filteredReports.length} rapports anciens supprimés`)
      }

      return true
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error)
      return false
    }
  }
}

// Instance exportée
export const storageService = StorageService
