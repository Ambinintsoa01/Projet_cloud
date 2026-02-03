import { VALIDATION_LIMITS, REPORT_CATEGORIES } from './constants.js'

// Validateurs pour les formulaires

// Validation d'email
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Email requis' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Format d\'email invalide' }
  }

  return { isValid: true, message: '' }
}

// Validation de mot de passe
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Mot de passe requis' }
  }

  const errors = []

  if (password.length < 8) {
    errors.push('Au moins 8 caractères')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Au moins une majuscule')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Au moins une minuscule')
  }

  if (!/\d/.test(password)) {
    errors.push('Au moins un chiffre')
  }

  return {
    isValid: errors.length === 0,
    message: errors.length > 0 ? errors.join(', ') : '',
    strength: getPasswordStrength(password)
  }
}

// Calcul de la force du mot de passe
export const getPasswordStrength = (password) => {
  if (!password) return 0

  let strength = 0

  // Longueur
  if (password.length >= 8) strength += 25
  if (password.length >= 12) strength += 25

  // Complexité
  if (/[A-Z]/.test(password)) strength += 20
  if (/[a-z]/.test(password)) strength += 10
  if (/\d/.test(password)) strength += 15
  if (/[^A-Za-z\d]/.test(password)) strength += 15

  return Math.min(strength, 100)
}

// Validation de confirmation de mot de passe
export const validatePasswordConfirmation = (password, confirmation) => {
  if (!confirmation) {
    return { isValid: false, message: 'Confirmation requise' }
  }

  if (password !== confirmation) {
    return { isValid: false, message: 'Les mots de passe ne correspondent pas' }
  }

  return { isValid: true, message: '' }
}

// Validation de nom complet
export const validateFullName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, message: 'Nom complet requis' }
  }

  const trimmed = name.trim()

  if (trimmed.length < 2) {
    return { isValid: false, message: 'Nom trop court (minimum 2 caractères)' }
  }

  if (trimmed.length > 100) {
    return { isValid: false, message: 'Nom trop long (maximum 100 caractères)' }
  }

  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed)) {
    return { isValid: false, message: 'Caractères non autorisés' }
  }

  return { isValid: true, message: '' }
}

// Validation de titre de signalement
export const validateReportTitle = (title) => {
  if (!title || typeof title !== 'string') {
    return { isValid: false, message: 'Titre requis' }
  }

  const trimmed = title.trim()

  if (trimmed.length < VALIDATION_LIMITS.TITLE.MIN_LENGTH) {
    return {
      isValid: false,
      message: `Titre trop court (minimum ${VALIDATION_LIMITS.TITLE.MIN_LENGTH} caractères)`
    }
  }

  if (trimmed.length > VALIDATION_LIMITS.TITLE.MAX_LENGTH) {
    return {
      isValid: false,
      message: `Titre trop long (maximum ${VALIDATION_LIMITS.TITLE.MAX_LENGTH} caractères)`
    }
  }

  return { isValid: true, message: '' }
}

// Validation de description
export const validateReportDescription = (description) => {
  if (!description || typeof description !== 'string') {
    return { isValid: false, message: 'Description requise' }
  }

  const trimmed = description.trim()

  if (trimmed.length < VALIDATION_LIMITS.DESCRIPTION.MIN_LENGTH) {
    return {
      isValid: false,
      message: `Description trop courte (minimum ${VALIDATION_LIMITS.DESCRIPTION.MIN_LENGTH} caractères)`
    }
  }

  if (trimmed.length > VALIDATION_LIMITS.DESCRIPTION.MAX_LENGTH) {
    return {
      isValid: false,
      message: `Description trop longue (maximum ${VALIDATION_LIMITS.DESCRIPTION.MAX_LENGTH} caractères)`
    }
  }

  return { isValid: true, message: '' }
}

// Validation de catégorie
export const validateReportCategory = (category) => {
  if (!category) {
    return { isValid: false, message: 'Catégorie requise' }
  }

  const validCategories = Object.values(REPORT_CATEGORIES)
  if (!validCategories.includes(category)) {
    return { isValid: false, message: 'Catégorie invalide' }
  }

  return { isValid: true, message: '' }
}

// Validation de coordonnées GPS
export const validateCoordinates = (lat, lng) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { isValid: false, message: 'Coordonnées invalides' }
  }

  if (lat < -90 || lat > 90) {
    return { isValid: false, message: 'Latitude invalide' }
  }

  if (lng < -180 || lng > 180) {
    return { isValid: false, message: 'Longitude invalide' }
  }

  return { isValid: true, message: '' }
}

// Validation de photos
export const validatePhoto = (file) => {
  if (!file) {
    return { isValid: false, message: 'Fichier requis' }
  }

  // Vérification du type
  if (!VALIDATION_LIMITS.PHOTOS.ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      message: 'Type de fichier non autorisé (JPEG, PNG, WebP uniquement)'
    }
  }

  // Vérification de la taille
  if (file.size > VALIDATION_LIMITS.PHOTOS.MAX_SIZE) {
    return {
      isValid: false,
      message: `Fichier trop volumineux (maximum ${VALIDATION_LIMITS.PHOTOS.MAX_SIZE / (1024 * 1024)}MB)`
    }
  }

  return { isValid: true, message: '' }
}

// Validation d'adresse
export const validateAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return { isValid: false, message: 'Adresse requise' }
  }

  const trimmed = address.trim()

  if (trimmed.length < 5) {
    return { isValid: false, message: 'Adresse trop courte' }
  }

  if (trimmed.length > 200) {
    return { isValid: false, message: 'Adresse trop longue' }
  }

  return { isValid: true, message: '' }
}

// Validation de formulaire complet de signalement
export const validateReportForm = (formData) => {
  const errors = {}

  // Validation du titre
  const titleValidation = validateReportTitle(formData.title)
  if (!titleValidation.isValid) {
    errors.title = titleValidation.message
  }

  // Validation de la description
  const descriptionValidation = validateReportDescription(formData.description)
  if (!descriptionValidation.isValid) {
    errors.description = descriptionValidation.message
  }

  // Validation de la catégorie
  const categoryValidation = validateReportCategory(formData.category)
  if (!categoryValidation.isValid) {
    errors.category = categoryValidation.message
  }

  // Validation des coordonnées
  if (formData.latitude && formData.longitude) {
    const coordsValidation = validateCoordinates(formData.latitude, formData.longitude)
    if (!coordsValidation.isValid) {
      errors.coordinates = coordsValidation.message
    }
  } else {
    errors.coordinates = 'Localisation requise'
  }

  // Validation de l'adresse
  if (formData.address) {
    const addressValidation = validateAddress(formData.address)
    if (!addressValidation.isValid) {
      errors.address = addressValidation.message
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validation de formulaire d'inscription
export const validateRegisterForm = (formData) => {
  const errors = {}

  // Validation du nom complet
  const nameValidation = validateFullName(formData.fullName)
  if (!nameValidation.isValid) {
    errors.fullName = nameValidation.message
  }

  // Validation de l'email
  const emailValidation = validateEmail(formData.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message
  }

  // Validation du mot de passe
  const passwordValidation = validatePassword(formData.password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message
  }

  // Validation de la confirmation
  const confirmationValidation = validatePasswordConfirmation(formData.password, formData.confirmPassword)
  if (!confirmationValidation.isValid) {
    errors.confirmPassword = confirmationValidation.message
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validation de formulaire de connexion
export const validateLoginForm = (formData) => {
  const errors = {}

  // Validation de l'email
  const emailValidation = validateEmail(formData.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message
  }

  // Validation du mot de passe (minimum requis)
  if (!formData.password || formData.password.length < 1) {
    errors.password = 'Mot de passe requis'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validation de numéro de téléphone (optionnel)
export const validatePhoneNumber = (phone) => {
  if (!phone) {
    // Numéro optionnel
    return { isValid: true, message: '' }
  }

  // Format Malagasy: +261 XX XXX XX ou 0XX XXX XXX
  const phoneRegex = /^(\+261|0)[0-9]{9}$/
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { isValid: false, message: 'Format de numéro invalide (+261 XX XXX XX ou 03X XXX XXX)' }
  }

  return { isValid: true, message: '' }
}

// Fonction utilitaire pour formater les messages d'erreur
export const formatValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') {
    return []
  }

  return Object.entries(errors).map(([field, message]) => ({
    field,
    message: Array.isArray(message) ? message.join(', ') : message
  }))
}

// Fonction utilitaire pour vérifier si un formulaire est valide
export const isFormValid = (validationResult) => {
  return validationResult && validationResult.isValid === true
}

// Fonction utilitaire pour obtenir le premier message d'erreur
export const getFirstErrorMessage = (validationResult) => {
  if (!validationResult || !validationResult.errors) {
    return ''
  }

  const errors = Object.values(validationResult.errors)
  return errors.length > 0 ? errors[0] : ''
}
