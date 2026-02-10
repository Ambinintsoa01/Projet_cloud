-- Insertion des rôles si n'existent pas
INSERT INTO roles (name) VALUES
('USER'),
('MANAGER'),
('ADMIN')
ON CONFLICT (name) DO NOTHING;

-- Insertion de l'utilisateur Carole si n'existe pas
INSERT INTO users (email, username, password, created_at)
VALUES (
    'carole16@gmail.com',
    'Carole Randrianarisoa',
    'Carole16',
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insertion de la relation utilisateur-rôle si n'existe pas
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r
WHERE u.email = 'carole16@gmail.com' 
  AND r.name = 'MANAGER'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
  );
