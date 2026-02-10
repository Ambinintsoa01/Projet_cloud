-- Seed default signalement types (id is auto-generated)
INSERT INTO type (libelle, icon_color, icon_symbol) VALUES
('Problème critique', 'red', '!'),
('Travaux en cours', 'purple', 'car'),
('Problème résolu', 'green', 'check'),
('Alerte signalée', 'yellow', '!'),
('Infrastructure endommagée', 'orange', 'wrench'),
('Problème d''inondation', 'blue', 'water'),
('Chaussée dégradée', 'red-white', 'checkered')
ON CONFLICT (libelle) DO NOTHING;
