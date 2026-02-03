import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { signalementService } from '../services/api';
import SignalementsTable from './SignalementsTable';
import 'leaflet/dist/leaflet.css';
import '../styles/VisitorDashboard.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Correspondance entre les symboles de la BD et les emojis/icônes
const getIconSymbol = (iconSymbol) => {
  if (!iconSymbol) return null;
  const symbols = {
    '!': '⚠️',
    'car': '🚗',
    'check': '✓',
    'wrench': '🔧',
    'water': '💧',
    'checkered': '🏁',
  };
  return symbols[iconSymbol] || iconSymbol;
};

const normalizeTypeId = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// Correspondance entre le libellé du type et l'emoji demandé
const getTypeEmoji = (type, fallbackTypeId = null) => {
  const label = typeof type === 'string'
    ? type
    : (type?.libelle || type?.label || type?.name || '').toString();
  const typeId = normalizeTypeId(type?.id || type?.typeId || fallbackTypeId);

  const labelMap = {
    'Problème critique': '⚠️',
    'Travaux en cours': '🚗',
    'Problème résolu': '✓',
    'Alerte signalée': '⚠️',
    'Infrastructure endommagée': '🔧',
    "Problème d'inondation": '💧',
    'Chaussée dégradée': '🏁',
  };

  const idMap = {
    1: '⚠️',
    2: '🚗',
    3: '✓',
    4: '⚠️',
    5: '🔧',
    6: '💧',
    7: '🏁',
  };

  if (label && labelMap[label]) {
    return labelMap[label];
  }
  if (typeId && idMap[typeId]) {
    return idMap[typeId];
  }

  return getIconSymbol(type?.icon_symbol || type?.iconSymbol) || '⚠️';
};

// Correspondance entre les couleurs de la BD et les codes couleur
const getIconColor = (iconColor) => {
  if (!iconColor) return '#6c757d';
  if (typeof iconColor === 'string' && iconColor.startsWith('#')) {
    return iconColor;
  }
  const colors = {
    'red': '#dc3545',
    'purple': '#6f42c1',
    'green': '#28a745',
    'yellow': '#ffc107',
    'orange': '#fd7e14',
    'blue': '#007bff',
    'red-white': '#dc3545',
  };
  return colors[iconColor] || '#6c757d';
};

const getTypeColorById = (typeId) => {
  const colorsById = {
    1: '#dc3545',
    2: '#6f42c1',
    3: '#28a745',
    4: '#ffc107',
    5: '#fd7e14',
    6: '#007bff',
    7: '#dc3545',
    8: '#666666',
    9: '#DD0000',
    10: '#999999',
  };
  return colorsById[typeId] || '#6c757d';
};

// Créer des icônes personnalisées pour chaque type
const createMarkerIcon = (signalement) => {
  const type = signalement?.type || null;
  const typeId = normalizeTypeId(type?.id || type?.typeId || signalement?.typeId || signalement?.type_id || signalement?.type);

  if (!type && !typeId) {
    return L.divIcon({
      html: `<div style="
        width: 40px;
        height: 40px;
        background-color: #6c757d;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        font-size: 18px;
      ">⚠️</div>`,
      className: "custom-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  }

  const color = getIconColor(type?.icon_color || type?.iconColor) || getTypeColorById(typeId);
  const symbol = getTypeEmoji(type, typeId);
  
  // Style spécial pour le motif damier (checkered)
  const isCheckered = (type?.icon_symbol || type?.iconSymbol) === 'checkered';
  const backgroundStyle = isCheckered
    ? `background: repeating-linear-gradient(
        45deg,
        ${color},
        ${color} 5px,
        white 5px,
        white 10px
      );`
    : `background-color: ${color};`;
  
  return L.divIcon({
    html: `<div style="
      width: 40px;
      height: 40px;
      ${backgroundStyle}
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 6px rgba(0,0,0,0.4);
      font-size: 18px;
    ">${symbol}</div>`,
    className: "custom-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

export default function VisitorDashboard() {
  const [signalements, setSignalements] = useState([]);
  const [signalementTypes, setSignalementTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('map'); // 'map', 'table', 'both'
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les signalements - utiliser preferFirebase: false pour les visiteurs
      const signalementsResponse = await signalementService.getAllSignalements({ preferFirebase: false });
      const signalementsList = Array.isArray(signalementsResponse) ? signalementsResponse : (signalementsResponse?.data || []);
      setSignalements(signalementsList);

      // Charger les types
      const typesResponse = await signalementService.getSignalementTypes();
      const typesList = Array.isArray(typesResponse) ? typesResponse : (typesResponse?.data || []);
      setSignalementTypes(typesList);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (signalement) => {
    if (signalement?.type?.libelle) return signalement.type.libelle;
    const rawTypeId = signalement?.typeId || signalement?.type?.id;
    if (!rawTypeId) return '—';
    const matched = signalementTypes.find((t) => String(t.id) === String(rawTypeId));
    return matched?.libelle || `Type #${rawTypeId}`;
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
    });
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'nouveau':
        return '#48bb78'; // vert
      case 'en_cours':
        return '#ed8936'; // orange
      case 'termine':
      case 'terminé':
        return '#3182ce'; // bleu
      default:
        return '#718096'; // gris
    }
  };

  if (loading) {
    return (
      <div className="visitor-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error && signalements.length === 0) {
    return (
      <div className="visitor-dashboard">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadData} className="retry-button">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="visitor-dashboard">
      {/* Header */}
      <div className="visitor-header">
        <div className="visitor-header-content">
          <div className="visitor-logo">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </div>
          <div className="visitor-title">
            <h1>🗺️ Carte des Signalements</h1>
            <p>Consultez les signalements routiers en temps réel</p>
          </div>
        </div>

        <div className="visitor-controls">
          <button 
            className={`view-toggle ${view === 'map' ? 'active' : ''}`}
            onClick={() => setView('map')}
            title="Afficher la carte"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
          <button 
            className={`view-toggle ${view === 'table' ? 'active' : ''}`}
            onClick={() => setView('table')}
            title="Afficher le tableau"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button 
            className={`view-toggle ${view === 'both' ? 'active' : ''}`}
            onClick={() => setView('both')}
            title="Afficher les deux"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4H5a2 2 0 00-2 2v14a2 2 0 002 2h4m0-18v18m0-18h10a2 2 0 012 2v14a2 2 0 01-2 2h-10m0-18v18m0 0H9" />
            </svg>
          </button>
          <button 
            onClick={loadData}
            className="refresh-button"
            title="Actualiser"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="login-button"
            title="Se connecter"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Se connecter
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`visitor-content ${view}`}>
        {/* Map Section */}
        {(view === 'map' || view === 'both') && (
          <div className="map-section">
            <div className="map-header">
              <h2>📍 Localisation des signalements</h2>
              <span className="marker-count">{signalements.length} signalement(s)</span>
            </div>
            <div className="map-container">
              {signalements.length > 0 ? (
                <MapContainer
                  center={[-18.8792, 47.5079]}
                  zoom={10}
                  className="leaflet-map"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {signalements.map((signalement) => {
                    if (signalement.latitude && signalement.longitude) {
                      const lat = parseFloat(signalement.latitude);
                      const lng = parseFloat(signalement.longitude);
                      if (!isNaN(lat) && !isNaN(lng)) {
                        return (
                          <Marker
                            key={signalement.id || signalement.firebaseId}
                            position={[lat, lng]}
                            icon={createMarkerIcon(signalement)}
                          >
                            <Popup className="custom-popup">
                              <div className="popup-content">
                                <h3>{getTypeLabel(signalement)}</h3>
                                <p className="popup-status">
                                  <span className={`badge status-${(signalement.status || '').toLowerCase()}`}>
                                    {getStatusLabel(signalement.status)}
                                  </span>
                                </p>
                                <p className="popup-description">{signalement.description || 'Aucune description'}</p>
                                <div className="popup-details">
                                  {signalement.surfaceM2 && (
                                    <p><strong>Surface:</strong> {parseFloat(signalement.surfaceM2).toLocaleString('fr-FR')} m²</p>
                                  )}
                                  {signalement.budget && (
                                    <p><strong>Budget:</strong> {parseFloat(signalement.budget).toLocaleString('fr-FR')} Ar</p>
                                  )}
                                  {signalement.entrepriseConcernee && (
                                    <p><strong>Entreprise:</strong> {signalement.entrepriseConcernee}</p>
                                  )}
                                  <p><strong>Date:</strong> {formatDate(signalement.dateCreation || signalement.createdAt)}</p>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }
                    }
                    return null;
                  })}
                </MapContainer>
              ) : (
                <div className="empty-map">
                  <p>Aucun signalement à afficher</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table Section */}
        {(view === 'table' || view === 'both') && (
          <div className="table-section">
            <SignalementsTable />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="visitor-footer">
        <p>💡 Conseil: Les couleurs des marqueurs indiquent le statut du signalement</p>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-marker" style={{ backgroundColor: '#48bb78' }}></span>
            <span>Nouveau</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker" style={{ backgroundColor: '#ed8936' }}></span>
            <span>En cours</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker" style={{ backgroundColor: '#3182ce' }}></span>
            <span>Terminé</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker" style={{ backgroundColor: '#718096' }}></span>
            <span>Autre</span>
          </div>
        </div>
      </div>
    </div>
  );
}
