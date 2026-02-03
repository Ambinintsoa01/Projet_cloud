import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import '../styles/BlockedUsers.css'

export default function BlockedUsers() {
  const navigate = useNavigate()
  const [blockedUsers, setBlockedUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUnblocking, setIsUnblocking] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [hasPermission, setHasPermission] = useState(true)

  // Charger les utilisateurs bloqués au montage
  useEffect(() => {
    checkPermissionsAndLoad()
  }, [])

  const checkPermissionsAndLoad = async () => {
    // Vérifier les rôles de l'utilisateur
    const currentUser = authService.getCurrentUser()
    
    if (!currentUser || !currentUser.roles) {
      setError('Impossible de vérifier les permissions')
      setIsLoading(false)
      return
    }

    // Vérifier si l'utilisateur a les rôles MANAGER ou ADMIN
    const hasManagerRole = currentUser.roles.some(role => 
      role === 'MANAGER' || role === 'ADMIN' || role.includes('MANAGER') || role.includes('ADMIN')
    )

    if (!hasManagerRole) {
      setHasPermission(false)
      setIsLoading(false)
      return
    }

    loadBlockedUsers()
  }

  const loadBlockedUsers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const users = await authService.getBlockedUsers()
      setBlockedUsers(users || [])
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs bloqués:', err)
      
      // Vérifier si c'est une erreur 403
      if (err.status === 403) {
        setHasPermission(false)
        setError('Vous n\'avez pas les permissions nécessaires pour accéder à cette page')
      } else {
        setError('Impossible de charger les utilisateurs bloqués')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnblockUser = async (userId, userEmail) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir débloquer ${userEmail} ?`)) {
      return
    }

    setIsUnblocking(true)

    try {
      await authService.unblockUser(userId)
      
      // Retirer l'utilisateur débloqué de la liste
      setBlockedUsers(prev => prev.filter(user => user.id !== userId))
      
      // Afficher un message de succès
      setSuccessMessage(`${userEmail} a été débloqué avec succès`)
      
      // Masquer le message après 3 secondes
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Erreur lors du déblocage:', err)
      setError('Impossible de débloquer cet utilisateur')
    } finally {
      setIsUnblocking(false)
    }
  }

  return (
    <div className="blocked-users-container">
      {/* En-tête */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Retour
        </button>
        <h1>Utilisateurs Bloqués</h1>
        <p className="page-subtitle">Gérez les comptes bloqués après trop de tentatives de connexion échouées</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-danger">
          <span>❌</span>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <span>✅</span>
          {successMessage}
        </div>
      )}

      {/* Contenu principal */}
      <div className="content-wrapper">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des utilisateurs bloqués...</p>
          </div>
        ) : !hasPermission ? (
          <div className="permission-denied">
            <div className="permission-icon">🔒</div>
            <h2>Accès refusé</h2>
            <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            <p className="permission-note">Seuls les administrateurs et gestionnaires (MANAGER/ADMIN) peuvent gérer les utilisateurs bloqués.</p>
            <button className="back-home-btn" onClick={() => navigate('/dashboard')}>
              Retourner au tableau de bord
            </button>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔓</div>
            <h2>Aucun utilisateur bloqué</h2>
            <p>Il n'y a actuellement aucun utilisateur avec un compte bloqué.</p>
          </div>
        ) : (
          <div className="users-grid">
            {blockedUsers.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                  <div className="user-info">
                    <h3 className="user-name">{user.username}</h3>
                    <p className="user-email">{user.email}</p>
                  </div>
                </div>

                <div className="user-details">
                  <div className="detail-row">
                    <span className="detail-label">ID Utilisateur:</span>
                    <span className="detail-value">#{user.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Créé le:</span>
                    <span className="detail-value">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {user.roles && user.roles.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Rôles:</span>
                      <div className="roles-badges">
                        {user.roles.map((role, idx) => (
                          <span key={idx} className="role-badge">
                            {role.name || role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="unblock-button"
                  onClick={() => handleUnblockUser(user.id, user.email)}
                  disabled={isUnblocking}
                >
                  {isUnblocking ? '⏳ Déblocage...' : '🔓 Débloquer'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistiques */}
      {!isLoading && blockedUsers.length > 0 && (
        <div className="stats-footer">
          <div className="stat">
            <span className="stat-value">{blockedUsers.length}</span>
            <span className="stat-label">utilisateur{blockedUsers.length !== 1 ? 's' : ''} bloqué{blockedUsers.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  )
}
