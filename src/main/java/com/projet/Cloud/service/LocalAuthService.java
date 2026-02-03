package com.projet.Cloud.service;

import com.projet.Cloud.dto.LoginRequest;
import com.projet.Cloud.dto.RegisterRequest;
import com.projet.Cloud.dto.UpdateUserRequest;
import com.projet.Cloud.dto.AuthResponse;
import com.projet.Cloud.model.User;

public interface LocalAuthService {
    AuthResponse authenticate(LoginRequest request);
    AuthResponse register(RegisterRequest request);

    // Méthode pour récupérer l'utilisateur par email
    // User findByEmail(String email);
    java.util.Optional<User> findByEmail(String email);

    User updateUser(Long id, UpdateUserRequest request); // <-- Ajouter cette ligne
}
