import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/Auth.css';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVisitorMode = () => {
    navigate('/visitor', { replace: true });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      console.log('🔍 Login response complète:', response);
      console.log('📋 Rôles reçus:', response.roles);
      console.log('🎯 Type de roles:', typeof response.roles);
      console.log('📊 Roles Array:', Array.isArray(response.roles) ? 'Oui' : 'Non');
      
      // Vérifier les rôles : autoriser MANAGER/ADMIN ou tout rôle non vide (USER)
      const roles = response.roles || [];
      const hasManager = Array.isArray(roles) && roles.includes('MANAGER');
      const hasAdmin = Array.isArray(roles) && roles.includes('ADMIN');
      const hasAny = Array.isArray(roles) && roles.length > 0;
      if (!(hasManager || hasAdmin || hasAny)) {
        console.warn('❌ Accès refusé: rôles =', response.roles);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('❌ Accès refusé ! Rôles invalides: ' + JSON.stringify(response.roles));
        setLoading(false);
        return;
      }
      
      console.log('✅ Login successful with MANAGER role:', response);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Back to Home Button */}
      <button 
        className="auth-back-btn"
        onClick={() => navigate('/')}
        title="Retour à la carte"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      {/* Animated background elements */}
      <div className="auth-background">
        <div className="auth-glow auth-glow-1"></div>
        <div className="auth-glow auth-glow-2"></div>
        <div className="auth-grid"></div>
        
        {/* Road markings effect */}
        <div className="road-marking road-marking-center"></div>
        <div className="road-marking-dashes">
          <div className="road-dash"></div>
          <div className="road-dash"></div>
          <div className="road-dash"></div>
          <div className="road-dash"></div>
        </div>
      </div>

      {/* Left side - Login form */}
      <div className="auth-side auth-side-left">
        <div className="auth-card">
          {/* Logo/Badge */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="auth-logo-text">
              <div className="auth-logo-title">ROAD ADMIN</div>
              <div className="auth-logo-subtitle">Système de gestion</div>
            </div>
          </div>

          {/* Title */}
          <div className="auth-header">
            <h2>Connexion</h2>
            <p>Accédez au panneau d'administration</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@roadreport.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Mot de passe</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-submit-btn">
              <span className="btn-content">
                {loading ? (
                  <>
                    <svg className="spinner" fill="none" viewBox="0 0 24 24">
                      <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </span>
              <div className="btn-overlay"></div>
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>
              Problème de connexion ?{' '}
              <a href="#support">Contactez le support</a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="auth-side auth-side-right">
        {/* Large warning icon background */}
        <div className="auth-bg-icon">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
}