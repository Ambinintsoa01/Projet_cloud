-- Migration Flyway pour créer la table type avec les colonnes d'icône
-- Placement: src/main/resources/db/migration/V3__Create_SignalementType_Table.sql

CREATE TABLE IF NOT EXISTS type (
    id BIGSERIAL PRIMARY KEY,
    libelle VARCHAR(255) NOT NULL UNIQUE,
    icon_color VARCHAR(50),
    icon_symbol VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer un index sur libelle pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_type_libelle ON type(libelle);

-- Insérer les types de signalements par défaut
INSERT INTO type (libelle, icon_color, icon_symbol) VALUES
(
    'Problème critique',
    'red',
    '!'
),
(
    'Travaux en cours',
    'purple',
    'car'
),
(
    'Problème résolu',
    'green',
    'check'
),
(
    'Alerte signalée',
    'yellow',
    '!'
),
(
    'Infrastructure endommagée',
    'orange',
    'wrench'
),
(
    'Problème d''inondation',
    'blue',
    'water'
),
(
    'Chaussée dégradée',
    'red-white',
    'checkered'
) ON CONFLICT (libelle) DO NOTHING;
