import { useState, useEffect } from 'react';
import { signalementService } from '../services/api';
import '../styles/Analytics.css';

function Analytics() {
  const [stats, setStats] = useState({
    totalSignalements: 0,
    completedSignalements: 0,
    inProgressSignalements: 0,
    newSignalements: 0,
    successRate: 0,
    avgProgress: 0,
    byStatus: {},
    avgBudgetCompleted: 0,
    avgSurfaceCompleted: 0,
    totalBudget: 0,
    totalSurface: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const signalements = await signalementService.getAllSignalements();

      if (!Array.isArray(signalements)) {
        setStats({
          totalSignalements: 0,
          completedSignalements: 0,
          inProgressSignalements: 0,
          newSignalements: 0,
          successRate: 0,
          avgProgress: 0,
          byStatus: {},
          avgBudgetCompleted: 0,
          avgSurfaceCompleted: 0,
          totalBudget: 0,
          totalSurface: 0
        });
        setLoading(false);
        return;
      }

      // Calculer les statistiques
      const total = signalements.length;
      
      // Compter par statut réel
      const byStatus = {
        'nouveau': 0,
        'en_cours': 0,
        'termine': 0,
        'autre': 0
      };

      let completed = 0;
      let inProgress = 0;
      let newCount = 0;
      let totalBudget = 0;
      let totalSurface = 0;
      let completedBudget = 0;
      let completedSurface = 0;
      let completedCount = 0;

      signalements.forEach(item => {
        const status = (item.status || '').toLowerCase();
        
        // Compter le budget et la surface
        const budget = parseFloat(item.budget) || 0;
        const surface = parseFloat(item.surfaceM2) || 0;
        totalBudget += budget;
        totalSurface += surface;

        // Classifier par statut
        if (status === 'nouveau') {
          byStatus['nouveau']++;
          newCount++;
        } else if (status === 'en_cours') {
          byStatus['en_cours']++;
          inProgress++;
        } else if (status === 'termine' || status === 'terminé') {
          byStatus['termine']++;
          completed++;
          completedBudget += budget;
          completedSurface += surface;
          completedCount++;
        } else if (status) {
          byStatus['autre']++;
        } else {
          byStatus['autre']++;
        }
      });

      const successRate = total > 0 ? ((completed / total) * 100).toFixed(2) : 0;
      
      // Calcul de l'avancement global basé sur les statuts
      // nouveau = 0%, en_cours = 50%, terminé = 100%
      const totalProgress = signalements.reduce((sum, item) => {
        const status = (item.status || '').toLowerCase();
        if (status === 'termine' || status === 'terminé') return sum + 100;
        if (status === 'en_cours') return sum + 50;
        return sum + 0; // nouveau ou autre = 0%
      }, 0);
      const avgProgress = total > 0 ? (totalProgress / total).toFixed(2) : 0;
      
      const avgBudgetCompleted = completedCount > 0 ? (completedBudget / completedCount).toFixed(2) : 0;
      const avgSurfaceCompleted = completedCount > 0 ? (completedSurface / completedCount).toFixed(2) : 0;

      setStats({
        totalSignalements: total,
        completedSignalements: completed,
        inProgressSignalements: inProgress,
        newSignalements: newCount,
        successRate: parseFloat(successRate),
        avgProgress: parseFloat(avgProgress),
        byStatus: byStatus.autre === 0 ? {
          'nouveau': byStatus.nouveau,
          'en_cours': byStatus.en_cours,
          'termine': byStatus.termine
        } : byStatus,
        avgBudgetCompleted: parseFloat(avgBudgetCompleted),
        avgSurfaceCompleted: parseFloat(avgSurfaceCompleted),
        totalBudget: totalBudget.toFixed(2),
        totalSurface: totalSurface.toFixed(2)
      });
    } catch (err) {
      console.error('❌ Erreur lors du chargement des statistiques:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>📊 Statistiques des Signalements</h1>
        <button className="refresh-btn" onClick={fetchAnalytics}>
          🔄 Actualiser
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="stats-grid">
        {/* Total Signalements */}
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Total Signalements</h3>
            <p className="stat-value">{stats.totalSignalements}</p>
          </div>
        </div>

        {/* Signalements Terminés */}
        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Terminés</h3>
            <p className="stat-value">{stats.completedSignalements}</p>
          </div>
        </div>

        {/* Signalements En Cours */}
        <div className="stat-card in-progress">
          <div className="stat-icon">⚙️</div>
          <div className="stat-content">
            <h3>En Cours</h3>
            <p className="stat-value">{stats.inProgressSignalements}</p>
          </div>
        </div>

        {/* Signalements Nouveaux */}
        <div className="stat-card pending">
          <div className="stat-icon">📌</div>
          <div className="stat-content">
            <h3>Nouveaux</h3>
            <p className="stat-value">{stats.newSignalements}</p>
          </div>
        </div>

        {/* Avancement Global */}
        <div className="stat-card progress">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Avancement Global</h3>
            <p className="stat-value">{stats.avgProgress}%</p>
            <small style={{fontSize: '0.75rem', opacity: 0.7}}>
              Nouveau: 0% | En cours: 50% | Terminé: 100%
            </small>
          </div>
        </div>
      </div>

      {/* Success Rate */}
      <div className="success-rate-section">
        <h2>Taux de Réussite</h2>
        <div className="success-rate-card">
          <div className="progress-ring-container">
            <svg className="progress-ring" width="200" height="200">
              <circle
                className="progress-ring-circle-bg"
                stroke="rgba(0, 0, 0, 0.1)"
                fill="transparent"
                r="90"
                cx="100"
                cy="100"
                strokeWidth="8"
              />
              <circle
                className="progress-ring-circle"
                stroke="#2196f3"
                fill="transparent"
                r="90"
                cx="100"
                cy="100"
                strokeWidth="8"
                style={{
                  strokeDasharray: `${2 * Math.PI * 90}`,
                  strokeDashoffset: `${2 * Math.PI * 90 * (1 - stats.successRate / 100)}`,
                  transition: 'stroke-dashoffset 0.5s ease'
                }}
              />
              <text
                x="100"
                y="105"
                textAnchor="middle"
                className="progress-text"
                fontSize="32"
                fontWeight="bold"
                fill="#1a202c"
              >
                {stats.successRate}%
              </text>
            </svg>
          </div>
          <div className="success-info">
            <p className="success-description">
              {stats.completedSignalements} sur {stats.totalSignalements} signalements terminés
            </p>
            <div className="success-detail">
              <span>Terminés: <strong>{stats.completedSignalements}</strong></span>
              <span>Total: <strong>{stats.totalSignalements}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution par Statut */}
      <div className="status-distribution">
        <h2>Distribution par Statut</h2>
        <div className="distribution-bars">
          {Object.entries(stats.byStatus).map(([status, count]) => {
            const percentage = stats.totalSignalements > 0 
              ? ((count / stats.totalSignalements) * 100).toFixed(1)
              : 0;
            
            return (
              <div key={status} className="distribution-item">
                <div className="distribution-header">
                  <span className="status-name">
                    {status === 'nouveau' && '📌 Nouveau'}
                    {status === 'en_cours' && '⚙️ En cours'}
                    {status === 'termine' && '✅ Terminé'}
                    {status === 'autre' && '❓ Autre'}
                  </span>
                  <span className="status-count">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className={`progress-bar progress-${status.toLowerCase().replace('_', '-')}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="analytics-summary">
        <h2>Résumé Analytique</h2>
        <div className="summary-content">
          <div className="summary-item">
            <h4>Taux de Completion</h4>
            <p className="summary-value">{stats.successRate}%</p>
            <p className="summary-desc">Pourcentage terminé</p>
          </div>
          
          <div className="summary-item">
            <h4>Signalements Actifs</h4>
            <p className="summary-value">{stats.inProgressSignalements + stats.newSignalements}</p>
            <p className="summary-desc">En cours + Nouveaux</p>
          </div>
          
          <div className="summary-item">
            <h4>Budget Total</h4>
            <p className="summary-value">{parseFloat(stats.totalBudget).toLocaleString('fr-FR')}</p>
            <p className="summary-desc">Tous les signalements</p>
          </div>

          <div className="summary-item">
            <h4>Surface Totale</h4>
            <p className="summary-value">{parseFloat(stats.totalSurface).toLocaleString('fr-FR')}</p>
            <p className="summary-desc">En m²</p>
          </div>

          <div className="summary-item">
            <h4>Budget Moyen (Terminés)</h4>
            <p className="summary-value">{parseFloat(stats.avgBudgetCompleted).toLocaleString('fr-FR')}</p>
            <p className="summary-desc">Par signalement</p>
          </div>

          <div className="summary-item">
            <h4>Surface Moyenne (Terminés)</h4>
            <p className="summary-value">{parseFloat(stats.avgSurfaceCompleted).toLocaleString('fr-FR')}</p>
            <p className="summary-desc">En m²</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
