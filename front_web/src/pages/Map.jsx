import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Map.css";
import { signalementService } from "../services/api.js";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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

const getStatusLabel = (status) => {
  const labels = {
    new: "Nouveau",
    in_progress: "En cours",
    completed: "Terminé",
  };
  return labels[status] || status;
};

const getStatusColor = (status) => {
  const colors = {
    new: "danger",
    in_progress: "warning",
    completed: "success",
  };
  return colors[status] || "secondary";
};

const getTypeLabelFromSignalement = (signalement) => {
  const type = signalement?.type;
  if (typeof type === 'string') return type;
  if (type?.libelle || type?.label || type?.name) {
    return type.libelle || type.label || type.name;
  }

  const typeId = normalizeTypeId(type?.id || signalement?.typeId || signalement?.type_id || signalement?.type);
  const labelById = {
    1: 'Problème critique',
    2: 'Travaux en cours',
    3: 'Problème résolu',
    4: 'Alerte signalée',
    5: 'Infrastructure endommagée',
    6: "Problème d'inondation",
    7: 'Chaussée dégradée',
    8: 'Détritus/Pollution',
    9: 'Circulation dangereuse',
    10: 'Autre',
  };
  return labelById[typeId] || '';
};

const formatDate = (dateString) => {
  if (!dateString) return "Date inconnue";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Map() {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tileIndex, setTileIndex] = useState(0);

  // Charger les signalements au montage
  useEffect(() => {
    loadSignalements();
  }, []);

  const loadSignalements = async () => {
    try {
      setLoading(true);
      setError(null);
      // Charger depuis PostgreSQL (cache local si offline)
      const data = await signalementService.getAllSignalements();
      console.log("✅ Signalements chargés:", data);
      setSignalements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Erreur chargement signalements:", err);
      setError("Erreur lors du chargement des signalements");
      // Charger les données de démonstration en cas d'erreur
      setSignalements(getMockSignalements());
    } finally {
      setLoading(false);
    }
  };

  const getMockSignalements = () => {
    return [
      {
        id: "1",
        title: "Nid de poule rue principale",
        description: "Grand nid de poule dangereux sur la rue principale",
        address: "Rue Principale, Antananarivo",
        latitude: -18.8792,
        longitude: 47.5079,
        status: "new",
        createdAt: new Date().toISOString(),
        createdBy: "user1",
        type: {
          id: 1,
          icon_color: "red",
          icon_symbol: "!",
          libelle: "Problème critique"
        }
      },
      {
        id: "2",
        title: "Route endommagée",
        description: "Route très endommagée nécessitant réparation urgente",
        address: "Avenue de l'Indépendance",
        latitude: -18.875,
        longitude: 47.52,
        status: "in_progress",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        createdBy: "user2",
        type: {
          id: 2,
          icon_color: "purple",
          icon_symbol: "car",
          libelle: "Travaux en cours"
        }
      },
      {
        id: "3",
        title: "Travaux terminés",
        description: "Réparation de route complétée avec succès",
        address: "Rue de la Paix",
        latitude: -18.885,
        longitude: 47.515,
        status: "completed",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        createdBy: "user3",
        type: {
          id: 3,
          icon_color: "green",
          icon_symbol: "check",
          libelle: "Problème résolu"
        }
      },
      {
        id: "4",
        title: "Infrastructure endommagée",
        description: "Pont endommagé nécessitant inspection",
        address: "Pont de Behoririka",
        latitude: -18.882,
        longitude: 47.523,
        status: "new",
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        createdBy: "user4",
        type: {
          id: 5,
          icon_color: "orange",
          icon_symbol: "wrench",
          libelle: "Infrastructure endommagée"
        }
      },
      {
        id: "5",
        title: "Problème d'inondation",
        description: "Route inondée suite aux fortes pluies",
        address: "Lac Anosy",
        latitude: -18.892,
        longitude: 47.520,
        status: "new",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        createdBy: "user5",
        type: {
          id: 6,
          icon_color: "blue",
          icon_symbol: "water",
          libelle: "Problème d'inondation"
        }
      },
      {
        id: "6",
        title: "Chaussée dégradée",
        description: "Surface de la route très dégradée",
        address: "67 Ha",
        latitude: -18.876,
        longitude: 47.530,
        status: "new",
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        createdBy: "user6",
        type: {
          id: 7,
          icon_color: "red-white",
          icon_symbol: "checkered",
          libelle: "Chaussée dégradée"
        }
      },
      {
        id: "7",
        title: "Alerte signalée",
        description: "Danger potentiel signalé par les riverains",
        address: "Analakely",
        latitude: -18.883,
        longitude: 47.524,
        status: "new",
        createdAt: new Date(Date.now() - 21600000).toISOString(),
        createdBy: "user7",
        type: {
          id: 4,
          icon_color: "yellow",
          icon_symbol: "!",
          libelle: "Alerte signalée"
        }
      },
    ];
  };

  // Multiple tile providers for fallback
  const tileProviders = [
    {
      name: "Local Tileserver",
      url: "http://localhost:8090/styles/basic-preview/{z}/{x}/{y}.png",
      attribution: '&copy; Local tileserver',
    },
    {
      name: "OpenStreetMap",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    {
      name: "OpenStreetMap DE",
      url: "https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    {
      name: "CartoDB",
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    },
  ];

  const handleTileError = () => {
    setTileIndex((prev) => (prev + 1) % tileProviders.length);
  };

  const currentTile = tileProviders[tileIndex];

  return (
    <div className="map-wrapper">
      {loading && (
        <div className="map-loading">
          <div className="spinner"></div>
          <p>Chargement de la carte...</p>
        </div>
      )}

      {error && !loading && (
        <div className="map-error">
          <p>{error}</p>
          {signalements.length > 0 && (
            <p className="error-note">(Données de démonstration affichées)</p>
          )}
        </div>
      )}

      <MapContainer
        center={[-18.8792, 47.5079]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="leaflet-container"
      >
        <TileLayer
          key={`tile-${tileIndex}`}
          url={currentTile.url}
          attribution={currentTile.attribution}
          minZoom={0}
          maxZoom={19}
          errorTileUrl="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          onError={handleTileError}
          crossOrigin="anonymous"
        />

        {/* Afficher les signalements */}
        {signalements.map((signalement) => (
          signalement.latitude &&
          signalement.longitude && (
            <Marker
              key={signalement.id}
              position={[signalement.latitude, signalement.longitude]}
              icon={createMarkerIcon(signalement)}
            >
              <Popup className="signalement-popup">
                <div className="popup-content">
                  <h3 className="popup-title">{signalement.title}</h3>
                  
                  {/* Afficher le type de signalement */}
                  {(signalement.type || signalement.typeId || signalement.type_id) && (
                    <div className="popup-type-badge">
                      <span 
                        className="type-badge" 
                        style={{ 
                          backgroundColor: getIconColor(signalement.type?.icon_color || signalement.type?.iconColor) || getTypeColorById(normalizeTypeId(signalement.type?.id || signalement.typeId || signalement.type_id || signalement.type)),
                          color: (signalement.type?.icon_color === 'yellow' || signalement.type?.iconColor === 'yellow') ? '#333' : 'white'
                        }}
                      >
                        {getTypeEmoji(signalement.type, normalizeTypeId(signalement.type?.id || signalement.typeId || signalement.type_id || signalement.type))} {getTypeLabelFromSignalement(signalement)}
                      </span>
                    </div>
                  )}

                  {/* Afficher le statut */}
                  <div className="popup-status">
                    <span className={`status-badge status-${signalement.status}`}>
                      Statut: {getStatusLabel(signalement.status)}
                    </span>
                  </div>

                  <div className="popup-address">
                    <strong>📍 Adresse:</strong>
                    <p>{signalement.address}</p>
                  </div>

                  <div className="popup-description">
                    <strong>📝 Description:</strong>
                    <p>{signalement.description}</p>
                  </div>

                  {signalement.surfaceM2 && (
                    <div className="popup-surface">
                      <strong>📐 Surface:</strong>
                      <p>{signalement.surfaceM2} m²</p>
                    </div>
                  )}

                  {signalement.budget && (
                    <div className="popup-budget">
                      <strong>💰 Prix/m² estimé:</strong>
                      <p>{new Intl.NumberFormat("fr-FR", { 
                        style: "currency", 
                        currency: "MGA",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(signalement.budget)}</p>
                    </div>
                  )}

                  <div className="popup-date">
                    <strong>📅 Date de signalement:</strong>
                    <p>{formatDate(signalement.createdAt)}</p>
                  </div>

                  <div className="popup-actions">
                    <button className="popup-btn-details">
                      Voir détails
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>

      {/* Légende des types */}
      <div className="map-legend">
        <h4>Légende</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-icon" style={{ backgroundColor: '#dc3545' }}>⚠️</span>
            <span>Problème critique</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon" style={{ backgroundColor: '#6f42c1' }}>🚗</span>
            <span>Travaux en cours</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon" style={{ backgroundColor: '#28a745' }}>✓</span>
            <span>Problème résolu</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon" style={{ backgroundColor: '#ffc107', color: '#333' }}>⚠️</span>
            <span>Alerte signalée</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon" style={{ backgroundColor: '#fd7e14' }}>🔧</span>
            <span>Infrastructure endommagée</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon" style={{ backgroundColor: '#007bff' }}>💧</span>
            <span>Problème d'inondation</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon checkered-icon">🏁</span>
            <span>Chaussée dégradée</span>
          </div>
        </div>
      </div>

      {/* Indicateur de nombre de signalements */}
      <div className="map-info">
        <p>
          {signalements.length} signalement(s) affiché(s)
          {error && " (données de démonstration)"}
        </p>
      </div>
    </div>
  );
}