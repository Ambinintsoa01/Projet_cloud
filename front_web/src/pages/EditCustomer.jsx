import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/EditCustomer.css';

export default function EditCustomer() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Récupérer la liste des utilisateurs depuis le backend
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const users = await authService.getUsers();
        setCustomers(Array.isArray(users) ? users : []);
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        setCustomers([]);
        
        if (err?.status === 403 || err?.statusCode === 403) {
          setError("Accès refusé : vous n'avez pas les permissions requises.");
          return;
        }

        if (err?.status === 401 || err?.statusCode === 401 || (err?.message && err.message.toString().toLowerCase().includes('unauthorized'))) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setError('Session expirée. Veuillez vous reconnecter.');
          navigate('/');
          return;
        }

        setError('Erreur lors du chargement des utilisateurs');
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      id: customer.id,
      username: customer.username || customer.name || '',
      email: customer.email,
    });
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.updateUser(formData.id, {
        username: formData.username,
        email: formData.email,
      });
      setSuccess('Utilisateur modifié avec succès !');
      setCustomers(prev => Array.isArray(prev) ? prev.map(c => 
        c.id === formData.id ? { ...c, username: formData.username, email: formData.email } : c
      ) : prev);
    } catch (err) {
      setError(err.message || 'Erreur lors de la modification');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!selectedCustomer) return;
    
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.unblockUser(selectedCustomer.id);
      setSuccess('Utilisateur débloqué avec succès !');
      setCustomers(prev => Array.isArray(prev) ? prev.map(c => 
        c.id === selectedCustomer.id ? { ...c, blocked: false } : c
      ) : prev);
      setSelectedCustomer({ ...selectedCustomer, blocked: false });
    } catch (err) {
      setError(err.message || 'Erreur lors du déblocage');
      console.error('Unblock error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    (customer.username || customer.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="edit-customer-container">
      {/* Section liste des utilisateurs */}
      <div className="customer-list-section">
        <div className="list-header">
          <div className="list-header-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h3>Utilisateurs</h3>
            <span className="user-count">{filteredCustomers.length} utilisateur{filteredCustomers.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="search-box">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Liste des utilisateurs */}
        {loadingCustomers ? (
          <div className="loading-state">
            <svg className="spinner" fill="none" viewBox="0 0 24 24">
              <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Chargement des utilisateurs...</p>
          </div>
        ) : (!Array.isArray(filteredCustomers) || filteredCustomers.length === 0) ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="customer-list">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className={`customer-item ${selectedCustomer?.id === customer.id ? 'selected' : ''} ${customer.blocked ? 'blocked' : ''}`}
                onClick={() => handleCustomerSelect(customer)}
              >
                <div className="customer-avatar">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="customer-info">
                  <span className="customer-name">{customer.username || customer.name}</span>
                  <span className="customer-email">{customer.email}</span>
                </div>
                {customer.blocked && (
                  <span className="blocked-badge">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section édition */}
      <div className="customer-edit-section">
        <div className="edit-customer-card">
          {!selectedCustomer ? (
            <div className="no-selection">
              <div className="no-selection-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3>Aucun utilisateur sélectionné</h3>
              <p>Sélectionnez un utilisateur dans la liste pour modifier ses informations</p>
            </div>
          ) : (
            <>
              <div className="edit-header">
                <div className="edit-header-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2>Modifier l'utilisateur</h2>
                  <p className="edit-subtitle">Mettez à jour les informations de {selectedCustomer.username || selectedCustomer.name}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="edit-form">
                {error && (
                  <div className="error-message">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
                
                {success && (
                  <div className="success-message">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{success}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="username">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    placeholder="Entrez le nom d'utilisateur"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Entrez l'email"
                  />
                </div>

                <div className="button-group">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? (
                      <>
                        <svg className="spinner" fill="none" viewBox="0 0 24 24">
                          <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Enregistrer
                      </>
                    )}
                  </button>
                  
                  {selectedCustomer?.blocked && (
                    <button
                      type="button"
                      className="btn-unblock"
                      onClick={handleUnblock}
                      disabled={loading}
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Débloquer
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}