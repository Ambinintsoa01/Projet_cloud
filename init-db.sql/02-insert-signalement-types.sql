-- Script pour initialiser les types de signalements avec icônes
-- À exécuter dans PostgreSQL après la création de la table

INSERT INTO type (id, libelle, icon_color, icon_symbol) VALUES
(1, 'Problème critique', 'red', '!'),
(2, 'Travaux en cours', 'purple', 'car'),
(3, 'Problème résolu', 'green', 'check'),
(4, 'Alerte signalée', 'yellow', '!'),
(5, 'Infrastructure endommagée', 'orange', 'wrench'),
(6, 'Problème d''inondation', 'blue', 'water'),
(7, 'Chaussée dégradée', 'red-white', 'checkered');

-- Sauvegarder la séquence pour les ID suivants
SELECT setval('type_id_seq', (SELECT MAX(id) FROM type) + 1);
