import { useEffect, useState, useMemo } from 'react';
import { authService, signalementService } from '../services/api';
import '../styles/SignalementsTable.css';

export default function SignalementsTable() {
  const [signalements, setSignalements] = useState([]);
  const [signalementTypes, setSignalementTypes] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les signalements
      const signalementsResponse = await signalementService.getAllSignalements();
      const signalementsList = Array.isArray(signalementsResponse) ? signalementsResponse : (signalementsResponse?.data || []);
      setSignalements(signalementsList);

      // Charger les types
      const typesResponse = await signalementService.getSignalementTypes();
      const typesList = Array.isArray(typesResponse) ? typesResponse : (typesResponse?.data || []);
      setSignalementTypes(typesList);

      // Charger les utilisateurs
      const usersResponse = await authService.getUsers();
      const usersList = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.data || []);
      const usersMap = usersList.reduce((acc, user) => {
        if (user?.id != null) {
          acc[String(user.id)] = user;
        }
        return acc;
      }, {});
      setUsersById(usersMap);

    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Calcul des statistiques
  const stats = useMemo(() => {
    const total = signalements.length;
    const nouveau = signalements.filter(s => (s.status || '').toLowerCase() === 'nouveau').length;
    const enCours = signalements.filter(s => (s.status || '').toLowerCase() === 'en_cours').length;
    const termine = signalements.filter(s => ['termine', 'terminé'].includes((s.status || '').toLowerCase())).length;
    const totalBudget = signalements.reduce((sum, s) => sum + (parseFloat(s.budget) || 0), 0);
    const totalSurface = signalements.reduce((sum, s) => sum + (parseFloat(s.surfaceM2) || 0), 0);

    return {
      total,
      nouveau,
      enCours,
      termine,
      totalBudget,
      totalSurface,
    };
  }, [signalements]);

  // Formatage de la date
  const formatDate = (dateValue) => {
    if (!dateValue) return '—';
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
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Obtenir le libellé du statut
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

  // Obtenir le type de signalement
  const getTypeLabel = (signalement) => {
    if (signalement?.type?.libelle) return signalement.type.libelle;
    const rawTypeId = signalement?.typeId || signalement?.type?.id;
    if (!rawTypeId) return '—';
    const matched = signalementTypes.find((t) => String(t.id) === String(rawTypeId));
    return matched?.libelle || `Type #${rawTypeId}`;
  };

  // Obtenir les infos utilisateur
  const getUserName = (signalement) => {
    if (signalement?.user) {
      return signalement.user.username || signalement.user.fullName || 'Utilisateur';
    }
    if (signalement?.userId && typeof signalement.userId === 'object') {
      return signalement.userId.username || signalement.userId.fullName || 'Utilisateur';
    }
    const rawUserId = signalement?.userId;
    if (rawUserId != null) {
      const matched = usersById[String(rawUserId)];
      if (matched) {
        return matched.username || matched.fullName || 'Utilisateur';
      }
    }
    return '—';
  };

  // Filtrage et tri
  const filteredAndSortedSignalements = useMemo(() => {
    let filtered = signalements;

    // Filtrage par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s => {
        const description = (s.description || '').toLowerCase();
        const entreprise = (s.entrepriseConcernee || '').toLowerCase();
        const type = getTypeLabel(s).toLowerCase();
        const user = getUserName(s).toLowerCase();
        return description.includes(searchLower) || 
               entreprise.includes(searchLower) ||
               type.includes(searchLower) ||
               user.includes(searchLower);
      });
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => (s.status || '').toLowerCase() === statusFilter);
    }

    // Filtrage par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(s => {
        const typeId = s?.typeId || s?.type?.id;
        return String(typeId) === String(typeFilter);
      });
    }

    // Tri
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = a.dateCreation || a.createdAt || 0;
          bValue = b.dateCreation || b.createdAt || 0;
          if (typeof aValue === 'object') {
            aValue = aValue?.seconds || aValue?._seconds || 0;
          }
          if (typeof bValue === 'object') {
            bValue = bValue?.seconds || bValue?._seconds || 0;
          }
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        case 'type':
          aValue = getTypeLabel(a);
          bValue = getTypeLabel(b);
          break;
        case 'budget':
          aValue = parseFloat(a.budget) || 0;
          bValue = parseFloat(b.budget) || 0;
          break;
        case 'surface':
          aValue = parseFloat(a.surfaceM2) || 0;
          bValue = parseFloat(b.surfaceM2) || 0;
          break;
        case 'coutEstime':
          const aBudget = parseFloat(a.budget) || 0;
          const aNiveau = parseInt(a.niveau) || 1;
          const aSurface = parseFloat(a.surfaceM2) || 0;
          aValue = aBudget * aSurface * aNiveau;
          
          const bBudget = parseFloat(b.budget) || 0;
          const bNiveau = parseInt(b.niveau) || 1;
          const bSurface = parseFloat(b.surfaceM2) || 0;
          bValue = bBudget * bSurface * bNiveau;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [signalements, search, statusFilter, typeFilter, sortBy, sortOrder, signalementTypes, usersById]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSignalements.length / itemsPerPage);
  const paginatedSignalements = filteredAndSortedSignalements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Changer l'ordre de tri
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Obtenir la classe CSS du statut
  const getStatusClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'nouveau':
        return 'status-nouveau';
      case 'en_cours':
        return 'status-en-cours';
      case 'termine':
      case 'terminé':
        return 'status-termine';
      case 'en_attente':
        return 'status-en-attente';
      default:
        return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="signalements-table-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="signalements-table-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadData} className="retry-button">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="signalements-table-page">
      <div className="page-header">
        <h1>📊 Tableau Récapitulatif des Signalements</h1>
        <button onClick={loadData} className="refresh-button">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <p className="stat-label">Total Signalements</p>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card nouveau">
          <div className="stat-icon">🆕</div>
          <div className="stat-info">
            <p className="stat-label">Nouveaux</p>
            <p className="stat-value">{stats.nouveau}</p>
          </div>
        </div>
        <div className="stat-card en-cours">
          <div className="stat-icon">⚙️</div>
          <div className="stat-info">
            <p className="stat-label">En cours</p>
            <p className="stat-value">{stats.enCours}</p>
          </div>
        </div>
        <div className="stat-card termine">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <p className="stat-label">Terminés</p>
            <p className="stat-value">{stats.termine}</p>
          </div>
        </div>
        <div className="stat-card budget">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <p className="stat-label">Budget Total</p>
            <p className="stat-value">{stats.totalBudget.toLocaleString('fr-FR')} Ar</p>
          </div>
        </div>
        <div className="stat-card surface">
          <div className="stat-icon">📏</div>
          <div className="stat-info">
            <p className="stat-label">Surface Totale</p>
            <p className="stat-value">{stats.totalSurface.toLocaleString('fr-FR')} m²</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="search-box">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select 
          value={statusFilter} 
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="filter-select"
        >
          <option value="all">Tous les statuts</option>
          <option value="nouveau">Nouveau</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
          <option value="en_attente">En attente</option>
        </select>

        <select 
          value={typeFilter} 
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="filter-select"
        >
          <option value="all">Tous les types</option>
          {signalementTypes.map(type => (
            <option key={type.id} value={type.id}>{type.libelle}</option>
          ))}
        </select>
      </div>

      {/* Tableau */}
      <div className="table-container">
        <table className="signalements-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('date')} className="sortable">
                Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('type')} className="sortable">
                Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Description</th>
              <th onClick={() => handleSort('status')} className="sortable">
                Statut {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('surface')} className="sortable">
                Surface (m²) {sortBy === 'surface' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('niveau')} className="sortable">
                Niveau {sortBy === 'niveau' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('budget')} className="sortable">
                Prix/m² (Ar) {sortBy === 'budget' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('coutEstime')} className="sortable">
                Coût Estimé (Ar) {sortBy === 'coutEstime' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Entreprise</th>
              <th>Utilisateur</th>
              <th>Localisation</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSignalements.length === 0 ? (
              <tr>
                <td colSpan="11" className="no-data">
                  Aucun signalement trouvé
                </td>
              </tr>
            ) : (
              paginatedSignalements.map((signalement) => (
                <tr key={signalement.id || signalement.firebaseId}>
                  <td>{formatDate(signalement.dateCreation || signalement.createdAt)}</td>
                  <td>{getTypeLabel(signalement)}</td>
                  <td className="description-cell">
                    <div className="description-text">
                      {signalement.description || '—'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(signalement.status)}`}>
                      {getStatusLabel(signalement.status)}
                    </span>
                  </td>
                  <td className="number-cell">
                    {signalement.surfaceM2 ? parseFloat(signalement.surfaceM2).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td className="number-cell">
                    {signalement.niveau || 1}
                  </td>
                  <td className="number-cell">
                    {signalement.budget ? parseFloat(signalement.budget).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td className="number-cell">
                    {(() => {
                      const budget = parseFloat(signalement.budget) || 0;
                      const niveau = parseInt(signalement.niveau) || 1;
                      const surface = parseFloat(signalement.surfaceM2) || 0;
                      const coutEstime = budget * surface * niveau;
                      return coutEstime > 0 ? coutEstime.toLocaleString('fr-FR') : '—';
                    })()}
                  </td>
                  <td>{signalement.entrepriseConcernee || '—'}</td>
                  <td>{getUserName(signalement)}</td>
                  <td className="location-cell">
                    {signalement.latitude && signalement.longitude ? (
                      <span className="location-coords">
                        {parseFloat(signalement.latitude).toFixed(4)}, {parseFloat(signalement.longitude).toFixed(4)}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            ← Précédent
          </button>
          <span className="pagination-info">
            Page {currentPage} sur {totalPages} ({filteredAndSortedSignalements.length} résultats)
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
