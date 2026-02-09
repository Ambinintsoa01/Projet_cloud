import { useEffect, useMemo, useState } from 'react';
import { authService, signalementService } from '../services/api';
import EditSignalementModal from '../components/EditSignalementModal';
import '../styles/Reports.css';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [signalementTypes, setSignalementTypes] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [editingSignalement, setEditingSignalement] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchReports();
    loadTypes();
    loadUsers();

    const handleOnline = () => {
      setIsOnline(true);
      fetchReports();
    };
    const handleOffline = () => {
      setIsOnline(false);
      fetchReports();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadTypes = async () => {
    try {
      const response = await signalementService.getSignalementTypes();
      const list = Array.isArray(response) ? response : (response?.data || []);
      setSignalementTypes(list);
    } catch (err) {
      // Ne pas bloquer la page si les types ne chargent pas
    }
  };

  const loadUsers = async () => {
    try {
      const response = await authService.getUsers();
      const list = Array.isArray(response) ? response : (response?.data || []);
      const map = list.reduce((acc, user) => {
        if (user?.id != null) {
          acc[String(user.id)] = user;
        }
        return acc;
      }, {});
      setUsersById(map);
    } catch (err) {
      // Ne pas bloquer si la liste des utilisateurs n'est pas accessible
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await signalementService.getAllSignalements();
      const list = Array.isArray(response) ? response : (response?.data || []);
      setReports(list);
    } catch (err) {
      console.error('Erreur lors du chargement des signalements:', err);
      setError('Erreur lors du chargement des signalements');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Date inconnue';
    let date;

    if (typeof dateValue === 'object') {
      const seconds = dateValue?.seconds ?? dateValue?._seconds;
      const nanos = dateValue?.nanoseconds ?? dateValue?._nanoseconds ?? 0;
      if (typeof seconds === 'number') {
        date = new Date(seconds * 1000 + Math.floor(nanos / 1e6));
      } else if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      } else {
        date = new Date(String(dateValue));
      }
    } else {
      date = new Date(dateValue);
    }
    if (Number.isNaN(date.getTime())) return 'Date inconnue';
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'nouveau':
        return 'Nouveau';
      case 'en_cours':
        return 'En cours';
      case 'termine':
      case 'terminé':
        return 'Terminé';
      case 'en_attente':
        return 'En attente';
      default:
        return status || 'Inconnu';
    }
  };

  const getTypeLabel = (report) => {
    if (report?.type?.libelle) return report.type.libelle;
    const rawTypeId = report?.typeId || report?.type?.id;
    if (!rawTypeId) return '—';
    const matched = signalementTypes.find((t) => String(t.id) === String(rawTypeId));
    return matched?.libelle || `Type #${rawTypeId}`;
  };

  const getUserInfo = (report) => {
    if (report?.user) {
      return {
        name: report.user.username || report.user.fullName || 'Utilisateur',
        email: report.user.email || '—'
      };
    }
    if (report?.userId && typeof report.userId === 'object') {
      return {
        name: report.userId.username || report.userId.fullName || 'Utilisateur',
        email: report.userId.email || '—'
      };
    }
    const rawUserId = report?.userId;
    if (rawUserId != null) {
      const matched = usersById[String(rawUserId)];
      if (matched) {
        return {
          name: matched.username || matched.fullName || 'Utilisateur',
          email: matched.email || '—'
        };
      }
    }
    return { name: 'Utilisateur', email: '—' };
  };

  const handleEditSignalement = (report) => {
    console.log('� [1] handleEditSignalement appelé avec report:', report);
    console.log('🔴 [1] report.id:', report?.id, 'typeof:', typeof report?.id);
    console.log('🔴 [1] Object.keys(report):', Object.keys(report || {}).join(', '));
    
    // Vérifier que l'ID existe vraiment
    if (!report?.id) {
      console.error('🔴 [CRITICAL] report.id est undefined/null!');
      console.log('🔴 [DEBUG] report object complet:', JSON.stringify(report, null, 2));
    }
    
    setEditingSignalement(report);
    setSaveError(null);
    setSaveSuccess(false);
    
    // Vérifier que l'état a bien été mis à jour
    setTimeout(() => {
      console.log('🔴 [2] État editingSignalement après setState (async):', editingSignalement);
    }, 0);
  };

  const handleCloseEditModal = () => {
    console.log('🚪 Fermeture du modal');
    setEditingSignalement(null);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSaveSignalement = async (updateData) => {
    const signalementId = updateData?.id || editingSignalement?.id;
    
    if (!signalementId) {
      console.error('❌ ID manquant. updateData:', updateData, 'editingSignalement:', editingSignalement);
      setSaveError('ID du signalement manquant');
      return;
    }

    try {
      console.log('💾 Reports: Sauvegarde du signalement #' + signalementId, updateData);
      setSaveError(null);
      setSaveSuccess(false);
      
      // Appeler l'API (sans l'ID dans le payload)
      const { id, ...dataToSend } = updateData;
      console.log('📤 Envoi des données:', dataToSend);
      
      const result = await signalementService.updateSignalement(signalementId, dataToSend);
      console.log('✅ Reports: Réponse du serveur:', result);
      
      // Attendre un bit puis actualiser
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 Reports: Rafraîchissement de la liste...');
      await fetchReports();
      console.log('✓ Reports: Liste rafraîchie');
      
      setSaveSuccess(true);
      
      // Fermer le modal après 1.5 secondes pour voir le message de succès
      setTimeout(() => {
        console.log('🚪 Reports: Fermeture du modal');
        handleCloseEditModal();
      }, 1500);
    } catch (err) {
      console.error('❌ Reports: Erreur lors de la sauvegarde:', err);
      setSaveError(err.message || err.data?.message || 'Erreur lors de la sauvegarde du signalement');
    }
  };

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((report) => {
      const statusMatch = statusFilter === 'all' || (report.status || '').toLowerCase() === statusFilter;
      if (!statusMatch) return false;
      if (!q) return true;
      const typeLabel = getTypeLabel(report) || '';
      const userInfo = getUserInfo(report);
      const userName = userInfo.name || userInfo.email || '';
      const desc = report.description || '';
      return [typeLabel, userName, desc, report.id].some((val) => String(val).toLowerCase().includes(q));
    });
  }, [reports, search, statusFilter, signalementTypes, usersById]);

  const stats = useMemo(() => {
    const total = reports.length;
    const byStatus = reports.reduce((acc, report) => {
      const key = (report.status || 'inconnu').toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return { total, byStatus };
  }, [reports]);

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Liste des signalements</h1>
          <p>Suivez tous les signalements déclarés dans le système</p>
          <div className={`connection-badge ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'Connecté (PostgreSQL)' : 'Hors ligne (cache local)'}
          </div>
        </div>
        <button className="refresh-btn" onClick={fetchReports} disabled={loading}>
          {loading ? '⟳ Actualisation...' : '⟳ Actualiser'}
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="reports-stats">
        <div className="stat-card">
          <span className="stat-title">Total</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Nouveau</span>
          <span className="stat-value">{stats.byStatus.nouveau || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">En cours</span>
          <span className="stat-value">{stats.byStatus.en_cours || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Terminé</span>
          <span className="stat-value">{stats.byStatus.termine || 0}</span>
        </div>
      </div>

      <div className="reports-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher par type, utilisateur, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="status-filter">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tous les statuts</option>
            <option value="nouveau">Nouveau</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="en_attente">En attente</option>
          </select>
        </div>
      </div>

      {loading && !reports.length ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des signalements...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <h3>Aucun signalement trouvé</h3>
          <p>Essayez de modifier vos filtres de recherche</p>
        </div>
      ) : (
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Description</th>
                <th>Utilisateur</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Localisation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report, index) => (
                <tr key={report.id || report.problemeId || `${report.createdAt || 'report'}-${index}`}>
                  <td>#{report.id || '—'}</td>
                  <td>{getTypeLabel(report)}</td>
                  <td className="description-cell">{report.description || '—'}</td>
                  <td>
                    <div className="user-cell">
                      <div className="user-name">{getUserInfo(report).name}</div>
                      <div className="user-email">{getUserInfo(report).email}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${(report.status || 'inconnu').toLowerCase()}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </td>
                  <td>{formatDate(report.createdAt || report.dateSignalement)}</td>
                  <td>
                    {report.latitude?.toFixed?.(5) || report.latitude || '—'},
                    {' '}
                    {report.longitude?.toFixed?.(5) || report.longitude || '—'}
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn edit-btn" 
                      onClick={() => {
                        console.log('🔴 [CLICK] Bouton Éditer cliqué pour report avec ID:', report.id, 'Keys:', Object.keys(report || {}).join(', '));
                        handleEditSignalement(report);
                      }}
                      title="Éditer le signalement"
                    >
                      ✎ Éditer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {saveSuccess && (
        <div className="success-alert">
          ✓ Signalement mis à jour avec succès
        </div>
      )}

      <EditSignalementModal 
        signalement={editingSignalement}
        isOpen={Boolean(editingSignalement)}
        onClose={handleCloseEditModal}
        onSave={handleSaveSignalement}
      />
    </div>
  );
}
