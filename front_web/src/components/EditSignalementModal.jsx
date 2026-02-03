import { useState, useEffect } from 'react';
import '../styles/EditSignalementModal.css';

export default function EditSignalementModal({ signalement, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    description: '',
    status: 'nouveau',
    surfaceM2: '',
    budget: '',
    entrepriseConcernee: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('� [Modal useEffect] signalement reçu:', signalement);
    console.log('🔵 [Modal useEffect] signalement?.id:', signalement?.id, 'typeof:', typeof signalement?.id);
    console.log('🔵 [Modal useEffect] isOpen:', isOpen);
    
    if (signalement && isOpen) {
      if (!signalement.id) {
        console.error('🔵 [CRITICAL] Modal reçoit signalement.id = undefined!');
        console.log('🔵 [DEBUG] signalement complet:', JSON.stringify(signalement, null, 2));
      }
      
      console.log('🔵 [Modal useEffect] Initialisation du form avec ID:', signalement.id);
      setFormData({
        description: signalement.description || '',
        status: signalement.status || 'nouveau',
        surfaceM2: signalement.surfaceM2 || '',
        budget: signalement.budget || '',
        entrepriseConcernee: signalement.entrepriseConcernee || ''
      });
      setError(null);
    }
  }, [signalement, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('✏️  Change:', name, '=', value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('📝 Modal: Appel de onSave avec ID:', signalement.id, 'Data:', formData);
      // Passer l'ID au parent pour qu'il puisse l'utiliser
      await onSave({ ...formData, id: signalement.id });
      console.log('✅ Modal: onSave terminé, fermeture du modal');
      // Ne pas fermer ici - laisser le parent gérer la fermeture après rafraîchissement
    } catch (err) {
      console.error('❌ Modal: Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde du signalement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !signalement) {
    console.log('🚫 Modal non affiché - isOpen:', isOpen, 'signalement:', !!signalement);
    return null;
  }

  console.log('✅ Modal affiché - ID:', signalement.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal edit-signalement-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modifier le signalement</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-alert">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-group">
              <label>Statut</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange}
                required
              >
                <option value="nouveau">Nouveau</option>
                <option value="en_cours">En cours</option>
                <option value="terminé">Terminé</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange}
                rows="4"
                maxLength="500"
              />
              <small>{formData.description.length}/500</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Surface (m²)</label>
                <input 
                  type="number" 
                  name="surfaceM2" 
                  value={formData.surfaceM2} 
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Budget (MGA)</label>
                <input 
                  type="number" 
                  name="budget" 
                  value={formData.budget} 
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Entreprise concernée</label>
              <input 
                type="text" 
                name="entrepriseConcernee" 
                value={formData.entrepriseConcernee} 
                onChange={handleChange}
                placeholder="Nom de l'entreprise (optionnel)"
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={onClose}
                disabled={loading}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="btn-save"
                disabled={loading}
              >
                {loading ? '⟳ Sauvegarde...' : '✓ Sauvegarder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
