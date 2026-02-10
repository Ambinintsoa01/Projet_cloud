import { useState, useEffect } from 'react';
import { problemService, signalementService } from '../services/api';
import '../styles/ProblemsManagement.css';

export default function ProblemsManagement() {
  const [problems, setProblems] = useState([]);
  const [signalementTypes, setSignalementTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [converting, setConverting] = useState(false);
  const [formData, setFormData] = useState({
    typeId: '',
    description: '',
    surfaceM2: '',
    prix_m2: '5'
  });
  const [formErrors, setFormErrors] = useState({});

  // Charger les problèmes ouverts et les types de signalement
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les problèmes ouverts
      console.log('🔄 ProblemsManagement: Chargement des problèmes...');
      const problemsResponse = await problemService.listOpenProblems();
      console.log('✅ ProblemsManagement: Problèmes reçus:', problemsResponse);
      const problemsList = Array.isArray(problemsResponse) ? problemsResponse : (problemsResponse?.data || []);
      console.log('📦 ProblemsManagement: Problèmes finaux:', problemsList);
      if (problemsList.length > 0) {
        console.log('👤 Premier problème - user:', problemsList[0].user);
        console.log('👤 Premier problème - userId:', problemsList[0].userId);
        console.log('👤 Premier problème - userName:', problemsList[0].userName);
      }
      setProblems(problemsList);

      // Charger les types de signalement
      console.log('🔄 ProblemsManagement: Chargement des types...');
      const typesResponse = await signalementService.getSignalementTypes();
      console.log('✅ ProblemsManagement: Types reçus:', typesResponse);
      const typesList = Array.isArray(typesResponse) ? typesResponse : (typesResponse?.data || []);
      setSignalementTypes(typesList);
    } catch (err) {
      console.error('❌ ProblemsManagement: Erreur chargement:', err);
      // Ne pas afficher d'erreur pour les appels sans auth, laisser vides
      setProblems([]);
      setSignalementTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const openConvertModal = (problem) => {
    setSelectedProblem(problem);
    setFormData({
      typeId: problem.typeId || '',
      description: problem.description,
      surfaceM2: '',
      prix_m2: '',
      niveau: '5'
    });
    setFormErrors({});
    setShowConvertModal(true);
  };

  const closeConvertModal = () => {
    setShowConvertModal(false);
    setSelectedProblem(null);
    setFormData({
      typeId: '',
      description: '',
      surfaceM2: '',
      prix_m2: '',
      niveau: '5'
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.typeId) {
      errors.typeId = 'Le type de signalement est obligatoire';
    }

    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = 'La description doit contenir au moins 10 caractères';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'La description ne doit pas dépasser 500 caractères';
    }

    if (formData.surfaceM2 && isNaN(parseFloat(formData.surfaceM2))) {
      errors.surfaceM2 = 'La surface doit être un nombre valide';
    }

    if (formData.prix_m2 && isNaN(parseFloat(formData.prix_m2))) {
      errors.prix_m2 = 'Le prix par m² doit être un nombre valide';
    }

    if (!formData.niveau || parseInt(formData.niveau) < 1 || parseInt(formData.niveau) > 10) {
      errors.niveau = 'Le niveau doit être entre 1 et 10';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitConversion = async (e) => {
    e.preventDefault();

    if (!validateForm() || !selectedProblem) {
      return;
    }

    setConverting(true);

    try {
      await problemService.convertProblem(selectedProblem.id, {
        typeId: formData.typeId,
        description: formData.description,
        surfaceM2: formData.surfaceM2 ? parseFloat(formData.surfaceM2) : null,
        budget: formData.prix_m2 ? parseFloat(formData.prix_m2) : null,
        niveau: formData.niveau ? parseInt(formData.niveau) : null
      });

      // Recharger la liste
      await fetchData();
      closeConvertModal();

      // Afficher un message de succès
      alert('Problème converti en signalement avec succès !');
    } catch (err) {
      console.error('Erreur lors de la conversion:', err);
      setError('Erreur lors de la conversion du problème');
    } finally {
      setConverting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getTypeName = (typeId) => {
    if (!typeId) return 'Non spécifié';
    const type = signalementTypes.find(t => t.id === typeId);
    return type?.libelle || typeId;
  };

  const getUserInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.split(' ');
    return parts.map(p => p.charAt(0).toUpperCase()).join('');
  };

  const getUserDisplayName = (problem) => {
    // Essayer plusieurs chemins possibles pour le nom
    if (problem.user?.fullName) return problem.user.fullName;
    if (problem.user?.username) return problem.user.username;
    if (problem.user?.email) return problem.user.email;
    if (problem.userName) return problem.userName;
    if (problem.username) return problem.username;
    if (problem.userEmail) return problem.userEmail;
    return 'Utilisateur anonyme';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="problems-management">
      <div className="problems-header">
        <h1>Gestion des problèmes signalés</h1>
        <p>Convertissez les problèmes en signalements formels</p>
        <button className="refresh-btn" onClick={fetchData} disabled={loading}>
          {loading ? '⟳ Actualisation...' : '⟳ Actualiser'}
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading && !problems.length ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des problèmes...</p>
        </div>
      ) : problems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <h3>Aucun problème en attente</h3>
          <p>Tous les problèmes signalés ont été traités</p>
        </div>
      ) : (
        <div className="problems-grid">
          {problems.map((problem) => (
            <div key={problem.id} className="problem-card">
              <div className="card-header">
                <div className="user-section">
                  <div className="avatar">{getUserInitials(getUserDisplayName(problem))}</div>
                  <div className="user-info">
                    <h3>{getUserDisplayName(problem)}</h3>
                    <p className="date">{formatDate(problem.createdAt)}</p>
                  </div>
                </div>
                <span className="status-badge">Ouvert</span>
              </div>

              <div className="card-body">
                <div className="location-info">
                  <span className="icon">📍</span>
                  <span>{problem.latitude?.toFixed(4)}, {problem.longitude?.toFixed(4)}</span>
                </div>

                <div className="description-section">
                  <p className="label">Problème signalé:</p>
                  <p className="text">{problem.description}</p>
                </div>

                {problem.typeId && (
                  <div className="type-section">
                    <p className="label">Type suggéré:</p>
                    <p className="type-name">{getTypeName(problem.typeId)}</p>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button
                  className="convert-btn"
                  onClick={() => openConvertModal(problem)}
                >
                  ✓ Convertir en signalement
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de conversion */}
      {showConvertModal && selectedProblem && (
        <div className="modal-overlay" onClick={closeConvertModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Convertir le problème</h2>
              <button className="close-btn" onClick={closeConvertModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="problem-summary">
                <h3>{selectedProblem.description}</h3>
                <p className="location">
                  📍 {selectedProblem.latitude?.toFixed(4)}, {selectedProblem.longitude?.toFixed(4)}
                </p>
              </div>

              <form onSubmit={handleSubmitConversion} className="conversion-form">
                {/* Type de signalement */}
                <div className="form-group">
                  <label htmlFor="typeId">
                    Type de signalement <span className="required">*</span>
                  </label>
                  <select
                    id="typeId"
                    name="typeId"
                    value={formData.typeId}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.typeId ? 'error' : ''}`}
                  >
                    <option value="">-- Sélectionner un type --</option>
                    {signalementTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.libelle}
                      </option>
                    ))}
                  </select>
                  {formErrors.typeId && (
                    <p className="error-message">{formErrors.typeId}</p>
                  )}
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="description">
                    Description complète <span className="required">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`form-input textarea ${formErrors.description ? 'error' : ''}`}
                    rows="4"
                    maxLength="500"
                  ></textarea>
                  <div className="char-count">
                    {formData.description?.length || 0}/500
                  </div>
                  {formErrors.description && (
                    <p className="error-message">{formErrors.description}</p>
                  )}
                </div>

                {/* Surface */}
                <div className="form-group">
                  <label htmlFor="surfaceM2">
                    Surface (m²)
                  </label>
                  <input
                    id="surfaceM2"
                    name="surfaceM2"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.surfaceM2}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.surfaceM2 ? 'error' : ''}`}
                    placeholder="Ex: 150"
                  />
                  {formErrors.surfaceM2 && (
                    <p className="error-message">{formErrors.surfaceM2}</p>
                  )}
                </div>

                {/* Prix par m² */}
                <div className="form-group">
                  <label htmlFor="prix_m2">
                    Prix par m² (Ariary)
                  </label>
                  <input
                    id="prix_m2"
                    name="prix_m2"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.prix_m2}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.prix_m2 ? 'error' : ''}`}
                    placeholder="Ex: 50000"
                  />
                  {formErrors.prix_m2 && (
                    <p className="error-message">{formErrors.prix_m2}</p>
                  )}
                </div>

                {/* Niveau */}
                <div className="form-group">
                  <label htmlFor="niveau">
                    Niveau de priorité <span className="required">*</span>
                  </label>
                  <select
                    id="niveau"
                    name="niveau"
                    value={formData.niveau}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.niveau ? 'error' : ''}`}
                  >
                    <option value="1">1 - Très faible</option>
                    <option value="2">2 - Faible</option>
                    <option value="3">3 - Assez faible</option>
                    <option value="4">4 - Modéré-</option>
                    <option value="5">5 - Modéré</option>
                    <option value="6">6 - Modéré+</option>
                    <option value="7">7 - Assez élevé</option>
                    <option value="8">8 - Élevé</option>
                    <option value="9">9 - Très élevé</option>
                    <option value="10">10 - Critique</option>
                  </select>
                  {formErrors.niveau && (
                    <p className="error-message">{formErrors.niveau}</p>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={closeConvertModal}
                    disabled={converting}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn-convert"
                    disabled={converting}
                  >
                    {converting ? '⟳ Conversion...' : '✓ Convertir'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
