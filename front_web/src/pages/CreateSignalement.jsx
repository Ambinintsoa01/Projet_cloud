import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { signalementService } from '../services/api';
import 'leaflet/dist/leaflet.css';
import '../styles/CreateSignalement.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ value, onChange }) {
  const position = useMemo(() => {
    if (!value?.latitude || !value?.longitude) return null;
    return [Number(value.latitude), Number(value.longitude)];
  }, [value]);

  useMapEvents({
    click(e) {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      onChange({ latitude: lat, longitude: lng });
    }
  });

  return position ? <Marker position={position} /> : null;
}

export default function CreateSignalement() {
  const [signalementTypes, setSignalementTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    typeId: '',
    description: '',
    surfaceM2: '',
    prix_m2: '',
    entrepriseConcernee: '',
    niveau: '5',
    isAnonymous: false
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadSignalementTypes();
  }, []);

  const loadSignalementTypes = async () => {
    try {
      const response = await signalementService.getSignalementTypes();
      const types = Array.isArray(response) ? response : (response?.data || []);
      setSignalementTypes(types);
    } catch (err) {
      console.error('Erreur lors du chargement des types:', err);
      setError('Erreur lors du chargement des types de signalement');
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.latitude || isNaN(parseFloat(formData.latitude))) {
      errors.latitude = 'La latitude est obligatoire et doit être un nombre';
    }

    if (!formData.longitude || isNaN(parseFloat(formData.longitude))) {
      errors.longitude = 'La longitude est obligatoire et doit être un nombre';
    }

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMapSelect = ({ latitude, longitude }) => {
    setFormData(prev => ({
      ...prev,
      latitude: latitude.toString(),
      longitude: longitude.toString()
    }));
    setFormErrors(prev => ({
      ...prev,
      latitude: null,
      longitude: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signalementService.createSignalement({
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        typeId: formData.typeId,
        niveau: formData.niveau ? parseInt(formData.niveau) : null,
        description: formData.description,
        surfaceM2: formData.surfaceM2 ? parseFloat(formData.surfaceM2) : null,
        budget: formData.prix_m2 ? parseFloat(formData.prix_m2) : null,
        entrepriseConcernee: formData.entrepriseConcernee || null,
        isAnonymous: formData.isAnonymous
      });

      setSubmitted(true);
      setFormData({
        latitude: '',
        longitude: '',
        typeId: '',
        description: '',
        surfaceM2: '',
        prix_m2: '',
        niveau: '5',
        entrepriseConcernee: '',
        isAnonymous: false
      });

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      setError('Erreur lors de la création du signalement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-signalement">
      <div className="form-header">
        <h1>Créer un signalement</h1>
        <p>Créez un nouveau signalement avec tous les détails</p>
      </div>

      {error && (
        <div className="error-alert">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {submitted && (
        <div className="success-alert">
          <span>✓ Signalement créé avec succès !</span>
          <button onClick={() => setSubmitted(false)}>✕</button>
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit} className="signalement-form">
          {/* Localisation */}
          <div className="form-section">
            <h2>Localisation</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="latitude">
                  Latitude <span className="required">*</span>
                </label>
                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  className={`form-input ${formErrors.latitude ? 'error' : ''}`}
                  placeholder="Ex: -18.879200"
                />
                {formErrors.latitude && (
                  <p className="error-message">{formErrors.latitude}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="longitude">
                  Longitude <span className="required">*</span>
                </label>
                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  className={`form-input ${formErrors.longitude ? 'error' : ''}`}
                  placeholder="Ex: 47.507900"
                />
                {formErrors.longitude && (
                  <p className="error-message">{formErrors.longitude}</p>
                )}
              </div>
            </div>

            <div className="map-picker">
              <div className="map-picker-header">
                <span>Choisir sur la carte</span>
                <span className="map-picker-hint">Cliquez pour définir la position</span>
              </div>
              <MapContainer
                center={[-18.8792, 47.5079]}
                zoom={13}
                className="map-picker-container"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <LocationPicker
                  value={{ latitude: formData.latitude, longitude: formData.longitude }}
                  onChange={handleMapSelect}
                />
              </MapContainer>
            </div>
          </div>

          {/* Informations du signalement */}
          <div className="form-section">
            <h2>Informations du signalement</h2>

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

            <div className="form-group">
              <label htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`form-input textarea ${formErrors.description ? 'error' : ''}`}
                rows="4"
                maxLength="500"
                placeholder="Décrivez le problème en détail..."
              ></textarea>
              <div className="char-count">
                {formData.description?.length || 0}/500
              </div>
              {formErrors.description && (
                <p className="error-message">{formErrors.description}</p>
              )}
            </div>
          </div>

          {/* Détails du projet */}
          <div className="form-section">
            <h2>Détails du projet</h2>

            <div className="form-row">
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
            </div>

            <div className="form-group">
              <label htmlFor="entrepriseConcernee">
                Entreprise concernée
              </label>
              <input
                id="entrepriseConcernee"
                name="entrepriseConcernee"
                type="text"
                value={formData.entrepriseConcernee}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Nom de l'entreprise (optionnel)"
              />
            </div>

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
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num.toString()}>
                    {num} - {num <= 3 ? 'Faible' : num <= 6 ? 'Moyen' : 'Élevé'}
                  </option>
                ))}
              </select>
              {formErrors.niveau && (
                <p className="error-message">{formErrors.niveau}</p>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="form-section">
            <div className="checkbox-group">
              <input
                id="isAnonymous"
                name="isAnonymous"
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={handleInputChange}
              />
              <label htmlFor="isAnonymous" className="checkbox-label">
                Publier anonymement
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? '⟳ Création...' : '✓ Créer le signalement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
