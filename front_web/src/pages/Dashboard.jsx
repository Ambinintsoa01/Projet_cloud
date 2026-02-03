import { useState, useEffect } from 'react';
import { authService } from '../services/api';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    serverStatus: 'Vérification...'
  });
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      // Si hors ligne, ne pas appeler l'API pour éviter les erreurs et les redirections
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setStats((prev) => ({
          ...prev,
          serverStatus: 'Hors ligne',
        }));
        return;
      }

      try {
        // Récupérer le nombre total d'utilisateurs
        console.log('📊 Dashboard: Chargement des utilisateurs...');
        const users = await authService.getUsers();
        console.log('📊 Dashboard: Utilisateurs chargés:', users);
        
        // TODO: Remplacer par vos vraies données de signalements
        const mockReports = {
          total: 2,
          pending: 5,
          resolved: 0
        };
        
        setStats({
          totalUsers: Array.isArray(users) ? users.length : 0,
          totalReports: mockReports.total,
          pendingReports: mockReports.pending,
          resolvedReports: mockReports.resolved,
          serverStatus: 'En ligne'
        });
      } catch (err) {
        console.error('❌ Dashboard: Erreur chargement stats:', err);
        // Garder les valeurs par défaut
        setStats(prev => ({
          ...prev,
          serverStatus: 'Données locales'
        }));
      }
    };
    
    fetchStats();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('Synchronisation en cours...');
    
    try {
      const response = await authService.forceSync();
      setSyncStatus('✅ Synchronisation réussie');
      setLastSync(new Date().toLocaleTimeString('fr-FR'));
      
      // Recharger les stats après la sync
      setTimeout(() => {
        const users = authService.getUsers();
        setStats(prev => ({
          ...prev,
          serverStatus: 'En ligne'
        }));
      }, 1000);
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        setSyncStatus('');
      }, 3000);
    } catch (error) {
      setSyncStatus('❌ Erreur de synchronisation');
      console.error('Erreur sync:', error);
      setTimeout(() => {
        setSyncStatus('');
      }, 3000);
    } finally {
      setSyncing(false);
    }
  };

  const resolvedPercentage = stats.totalReports > 0 
    ? Math.round((stats.resolvedReports / stats.totalReports) * 100) 
    : 0;

  return (
    <div className="dashboard-home">
      <div className="welcome-card">
        <div className="welcome-icon">🛣️</div>
        <h2>Tableau de bord - Signalements routiers</h2>
        <p>Gérez et suivez tous les signalements de votre système</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-amber">
          <div className="stat-icon stat-icon-amber">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>Total signalements</h3>
            <p className="stat-value">{stats.totalReports}</p>
            <span className="stat-label">Tous les signalements</span>
          </div>
          <div className="stat-trend stat-trend-up">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-icon stat-icon-orange">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>En attente</h3>
            <p className="stat-value">{stats.pendingReports}</p>
            <span className="stat-label">À traiter</span>
          </div>
          <div className="stat-badge stat-badge-warning">
            Urgent
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-icon stat-icon-green">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>Résolus</h3>
            <p className="stat-value">{stats.resolvedReports}</p>
            <span className="stat-label">{resolvedPercentage}% du total</span>
          </div>
          <div className="stat-trend stat-trend-neutral">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="stat-card stat-card-blue">
          <div className="stat-icon stat-icon-blue">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>Utilisateurs</h3>
            <p className="stat-value">{stats.totalUsers}</p>
            <span className="stat-label">Citoyens actifs</span>
          </div>
          <div className="stat-trend stat-trend-up">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
       
        <div className="info-section info-section-actions">
          <h3>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Actions rapides
          </h3>
          <div className="quick-actions">
            <button className="quick-action-btn quick-action-primary">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau signalement
            </button>
            <button className="quick-action-btn quick-action-secondary">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Voir rapports
            </button>
            <button 
              className="quick-action-btn quick-action-secondary"
              onClick={handleSync}
              disabled={syncing}
              title="Synchroniser Firebase ↔ PostgreSQL"
            >
              <svg 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                className={syncing ? 'spinning' : ''}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
              </svg>
              {syncing ? 'Sync...' : 'Synchroniser'}
            </button>
          </div>
          {syncStatus && (
            <div className="sync-status-message">
              {syncStatus}
            </div>
          )}
          {lastSync && (
            <div className="last-sync-info">
              Dernière sync: {lastSync}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}