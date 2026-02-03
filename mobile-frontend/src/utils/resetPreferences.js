// Utilitaire pour nettoyer les préférences et forcer le mode clair
// Exécuter dans la console du navigateur si nécessaire

export const resetPreferences = () => {
  localStorage.removeItem('preferences')
  localStorage.removeItem('road-alert-preferences')
  document.documentElement.classList.remove('ion-palette-dark')
  console.log('✅ Préférences réinitialisées - Mode clair activé')
  window.location.reload()
}

export const forceeLightMode = () => {
  const preferences = {
    darkMode: false,
    theme: 'light',
    language: 'fr',
    notifications: true,
    offlineMode: false,
    myReportsOnly: false
  }
  localStorage.setItem('preferences', JSON.stringify(preferences))
  document.documentElement.classList.remove('ion-palette-dark')
  console.log('✅ Mode clair forcé')
  window.location.reload()
}

// Disponible globalement dans la console
if (typeof window !== 'undefined') {
  window.resetPreferences = resetPreferences
  window.forceLightMode = forceeLightMode
  console.log('🔧 Utilitaires disponibles: resetPreferences(), forceLightMode()')
}
