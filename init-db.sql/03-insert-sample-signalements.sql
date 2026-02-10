-- Insertion de données de signalements d'exemple
-- Ces données ne s'inséreront que si elles n'existent pas encore

-- Assurez-vous que l'utilisateur Carole existe (id = 1)
-- Assurez-vous que les types de signalement existent (1-7)

INSERT INTO signalements (
    user_id,
    type_id,
    latitude,
    longitude,
    description,
    surface_m2,
    budget,
    niveau,
    status,
    date_signalement,
    created_at
) VALUES
-- Nid de poule rue Jean de la Fontaine
(1, 1, -18.8829, 47.5227, 'Gros nid de poule sur la route Jean de la Fontaine, danger pour les véhicules', 2.5, 150000, 7, 'nouveau', NOW(), NOW()),

-- Égout bouché avenue de l'Indépendance
(1, 2, -18.8750, 47.5150, 'Égout complètement bouché devant le magasin OTIV, eau stagnante depuis 1 semaine', 1.8, 200000, 8, 'nouveau', NOW(), NOW()),

-- Dégât des eaux immeuble Andohatapenaka
(1, 3, -18.8900, 47.5300, 'Importante fuite d''eau depuis le toit de l''immeuble, dégâts intérieurs visibles', 15.0, 850000, 9, 'en_cours', NOW(), NOW()),

-- Trottoir effondré rue de France
(1, 4, -18.8800, 47.5180, 'Trottoir complètement effondré sur 4 mètres, zone très fréquentée', 4.0, 300000, 8, 'nouveau', NOW(), NOW()),

-- Lavaka (érosion) zone Ankadikely
(1, 5, -18.9050, 47.5095, 'Importante ravine d''érosion menaçant les habitations, surface estimée à 500m²', 500.0, 50000, 9, 'nouveau', NOW(), NOW()),

-- Bâtiment délabré rue Jeanson
(1, 6, -18.8850, 47.5250, 'Ancien bâtiment colonial en ruines, risque d''effondrement, façade danger', 35.0, 200000, 8, 'nouveau', NOW(), NOW()),

-- Inondation saisonnière Ambohidahy
(1, 7, -18.9020, 47.5350, 'Zone sujette aux inondations pendant la saison des pluies, besoin de canalisation', 1200.0, 8000, 7, 'en_cours', NOW(), NOW()),

-- Route dégradée quartier Behoririka
(1, 1, -18.9100, 47.5200, 'Route en très mauvais état, multiples nids de poule, risque d''accident', 3.0, 120000, 6, 'nouveau', NOW(), NOW()),

-- Fosse septique débordante Andraharo
(1, 2, -18.8780, 47.5400, 'Problème de fosse septique publique débordante, risque sanitaire', 2.0, 180000, 8, 'nouveau', NOW(), NOW()),

-- Marécage zone Manakambahiny
(1, 3, -18.9150, 47.5280, 'Zone marécageuse à drainer, problème d''humidité chronique', 800.0, 25000, 5, 'nouveau', NOW(), NOW())
ON CONFLICT DO NOTHING;
