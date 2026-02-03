// Constantes de l'application Signalement Travaux Routiers

// Statuts des signalements
export const REPORT_STATUSES = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
}

// Labels des statuts
export const REPORT_STATUS_LABELS = {
  [REPORT_STATUSES.NEW]: 'Nouveau',
  [REPORT_STATUSES.IN_PROGRESS]: 'En cours',
  [REPORT_STATUSES.COMPLETED]: 'Terminé'
}

// Couleurs des statuts
export const REPORT_STATUS_COLORS = {
  [REPORT_STATUSES.NEW]: '#dc3545', // Rouge
  [REPORT_STATUSES.IN_PROGRESS]: '#ffc107', // Jaune
  [REPORT_STATUSES.COMPLETED]: '#28a745' // Vert
}

// Icônes des statuts
export const REPORT_STATUS_ICONS = {
  [REPORT_STATUSES.NEW]: 'ellipse',
  [REPORT_STATUSES.IN_PROGRESS]: 'ellipse',
  [REPORT_STATUSES.COMPLETED]: 'checkmark-circle'
}

// Catégories de problèmes
export const REPORT_CATEGORIES = {
  POTHOLE: 'pothole',
  ROADWORK: 'roadwork',
  LIGHTING: 'lighting',
  WASTE: 'waste',
  TRAFFIC_LIGHT: 'traffic_light',
  SIGNAGE: 'signage',
  FLOODING: 'flooding',
  OTHER: 'other'
}

// Labels des catégories
export const REPORT_CATEGORY_LABELS = {
  [REPORT_CATEGORIES.POTHOLE]: 'Nid-de-poule',
  [REPORT_CATEGORIES.ROADWORK]: 'Travaux en cours',
  [REPORT_CATEGORIES.LIGHTING]: 'Éclairage défectueux',
  [REPORT_CATEGORIES.WASTE]: 'Déchets sur voie',
  [REPORT_CATEGORIES.TRAFFIC_LIGHT]: 'Feu tricolore HS',
  [REPORT_CATEGORIES.SIGNAGE]: 'Signalisation manquante',
  [REPORT_CATEGORIES.FLOODING]: 'Inondation',
  [REPORT_CATEGORIES.OTHER]: 'Autre'
}

// Icônes des catégories
export const REPORT_CATEGORY_ICONS = {
  [REPORT_CATEGORIES.POTHOLE]: 'ellipse-outline',
  [REPORT_CATEGORIES.ROADWORK]: 'construct-outline',
  [REPORT_CATEGORIES.LIGHTING]: 'bulb-outline',
  [REPORT_CATEGORIES.WASTE]: 'trash-outline',
  [REPORT_CATEGORIES.TRAFFIC_LIGHT]: 'traffic-light-outline',
  [REPORT_CATEGORIES.SIGNAGE]: 'information-circle-outline',
  [REPORT_CATEGORIES.FLOODING]: 'water-outline',
  [REPORT_CATEGORIES.OTHER]: 'help-circle-outline'
}

// Emojis des catégories (pour la grille)
export const REPORT_CATEGORY_EMOJIS = {
  [REPORT_CATEGORIES.POTHOLE]: '🕳️',
  [REPORT_CATEGORIES.ROADWORK]: '🚧',
  [REPORT_CATEGORIES.LIGHTING]: '💡',
  [REPORT_CATEGORIES.WASTE]: '🚮',
  [REPORT_CATEGORIES.TRAFFIC_LIGHT]: '🚦',
  [REPORT_CATEGORIES.SIGNAGE]: '🚸',
  [REPORT_CATEGORIES.FLOODING]: '🌊',
  [REPORT_CATEGORIES.OTHER]: '📌'
}

// Configuration de la carte
export const MAP_CONFIG = {
  CENTER: [-18.8792, 47.5079], // Antananarivo
  ZOOM: {
    DEFAULT: 13,
    MIN: 12,
    MAX: 18,
    USER_LOCATION: 16
  },
  TILE_LAYER: {
    URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION: '© OpenStreetMap contributors'
  }
}

// Limites de validation
export const VALIDATION_LIMITS = {
  TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500
  },
  PHOTOS: {
    MAX_COUNT: 3,
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  },
  LOCATION: {
    ACCURACY_THRESHOLD: 100 // mètres
  }
}

// Délais de simulation API
export const API_DELAYS = {
  FAST: 500,
  NORMAL: 1000,
  SLOW: 2000,
  VERY_SLOW: 3000
}

// Messages d'erreur
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion réseau',
  VALIDATION_ERROR: 'Erreur de validation',
  PERMISSION_DENIED: 'Permission refusée',
  LOCATION_UNAVAILABLE: 'Localisation indisponible',
  CAMERA_ERROR: 'Erreur d\'accès à la caméra',
  FILE_TOO_LARGE: 'Fichier trop volumineux',
  INVALID_FILE_TYPE: 'Type de fichier non autorisé',
  GENERIC_ERROR: 'Une erreur inattendue s\'est produite'
}

// Messages de succès
export const SUCCESS_MESSAGES = {
  REPORT_CREATED: 'Signalement créé avec succès',
  REPORT_UPDATED: 'Signalement mis à jour',
  PHOTO_UPLOADED: 'Photo ajoutée',
  LOCATION_FOUND: 'Localisation trouvée',
  SYNC_COMPLETED: 'Synchronisation terminée'
}

// Configuration de l'application
export const APP_CONFIG = {
  NAME: 'Signalement Travaux Routiers',
  VERSION: '1.0.0',
  AUTHOR: 'MrRojo Team',
  DESCRIPTION: 'Application mobile de signalement des problèmes routiers à Antananarivo'
}

// Routes de l'application
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  MAP: '/map',
  REPORT_NEW: '/report/new',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SEARCH: '/search',
  SYNC: '/sync'
}

// Configuration Ionic
export const IONIC_CONFIG = {
  MODE: 'md', // Material Design
  SWIPE_BACK_ENABLED: true,
  HARDWARE_BACK_BUTTON: true
}

// Configuration Capacitor
export const CAPACITOR_CONFIG = {
  APP_ID: 'com.mrrojo.signalement',
  APP_NAME: 'Signalement Travaux Routiers',
  BUNDLED_WEB_RUNTIME: false
}

// Préférences utilisateur par défaut
export const DEFAULT_USER_PREFERENCES = {
  theme: 'light', // light, dark, system
  language: 'fr', // fr, mg (malagasy)
  notifications: true,
  offlineMode: false,
  myReportsOnly: false,
  locationTracking: true
}

// Statistiques par défaut
export const DEFAULT_STATS = {
  total: 0,
  new: 0,
  inProgress: 0,
  completed: 0,
  mine: 0
}

// Formats de date
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DDTHH:mm:ssZ',
  RELATIVE: {
    NOW: 'À l\'instant',
    MINUTES: 'Il y a {count} minute{s}',
    HOURS: 'Il y a {count} heure{s}',
    DAYS: 'Il y a {count} jour{s}',
    WEEKS: 'Il y a {count} semaine{s}',
    MONTHS: 'Il y a {count} mois'
  }
}

// Animations
export const ANIMATIONS = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500
  },
  EASING: {
    STANDARD: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    DECELERATE: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    ACCELERATE: 'cubic-bezier(0.4, 0.0, 1, 1)'
  }
}
