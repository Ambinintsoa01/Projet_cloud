package com.projet.Cloud.service;

import com.projet.Cloud.config.FirebaseProperties;
import com.projet.Cloud.dto.AuthResponse;
import com.projet.Cloud.dto.LoginRequest;
import com.projet.Cloud.dto.RegisterRequest;
import com.projet.Cloud.dto.UpdateUserRequest;
import com.projet.Cloud.model.User;
import com.projet.Cloud.repository.AccountLockRepository;
import com.projet.Cloud.util.JwtUtil;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;


@Service
@Primary
@Slf4j
public class HybridAuthService implements AuthService {

    private final FirebaseAuthService firebaseAuthService;
    private final LocalAuthService localAuthService;
    private final AuthAttemptService authAttemptService;

    private final AccountLockRepository accountLockRepository;


    @Value("${firebase.connection.timeout:3000}")
    private int connectionTimeout;

    @Value("${firebase.host:www.google.com}")
    private String testHost;

    @Value("${firebase.port:443}")
    private int testPort;

    private final FirebaseProperties firebaseProps;

    @Autowired
    public HybridAuthService(
            FirebaseAuthService firebaseAuthService,
            LocalAuthService localAuthService,
            FirebaseProperties firebaseProps,
            AuthAttemptService authAttemptService,
            AccountLockRepository accountLockRepository) {

        this.firebaseAuthService = firebaseAuthService;
        this.localAuthService = localAuthService;
        this.firebaseProps = firebaseProps;
        this.authAttemptService = authAttemptService;
        this.accountLockRepository = accountLockRepository;
    }


    @Override
    public AuthResponse authenticate(LoginRequest request) {

        String username = request.getEmail();

        // 🔒 1. Vérification AVANT login
        authAttemptService.checkIfLocked(username);

        try {
            AuthResponse response;

            if (isOnline()) {
                log.info("Mode ONLINE - Firebase");
                response = firebaseAuthService.authenticate(request);
                syncToLocal(request, response);
            } else {
                log.info("Mode OFFLINE - Local");
                response = authenticateOffline(request);
            }

            // ✅ 2. Succès → reset compteur
            authAttemptService.loginSucceeded(username);
            return response;

        } catch (Exception e) {

            // ❌ 3. Échec → incrément compteur
            authAttemptService.loginFailed(username);
            throw e;
        }
    }


    /**
     * Authentification en mode offline via la base PostgreSQL
     */
    private AuthResponse authenticateOffline(LoginRequest request) {
        // Récupérer l'utilisateur depuis PostgreSQL
        java.util.Optional<User> userOpt = localAuthService.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Utilisateur introuvable en mode offline");
        }

        User user = userOpt.get();
        
        // Extraire les rôles
        java.util.Set<String> roleNames = new java.util.HashSet<>();
        for (com.projet.Cloud.model.Role role : user.getRoles()) {
            roleNames.add(role.getName());
        }
        
        // Générer le token local/offline
        AuthResponse response = new AuthResponse();
        response.setToken(generateOfflineToken(user.getId().toString(), user.getEmail()));
        response.setExpiresAt(System.currentTimeMillis() + 3600000); // 1h
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setRoles(roleNames);
        return response;
    }


    @Override
    public AuthResponse register(RegisterRequest request) {
        if (isOnline()) {
            try {
                log.info("Mode ONLINE - Enregistrement via Firebase");
                AuthResponse response = firebaseAuthService.register(request);
                // Synchroniser avec la base locale
                syncRegistrationToLocal(request, response);
                return response;
            } catch (Exception e) {
                log.warn("Échec de l'enregistrement Firebase, basculement vers local: {}", e.getMessage());
                return localAuthService.register(request);
            }
        } else {
            log.info("Mode OFFLINE - Enregistrement local (sera synchronisé lors de la reconnexion)");
            return localAuthService.register(request);
        }
    }

    public User updateUser(Long id, UpdateUserRequest request) {
        User updatedUser = localAuthService.updateUser(id, request);

        if (isOnline()) {
            try {
                firebaseAuthService.updateFirebaseUser(updatedUser, request);
            } catch (Exception e) {
                log.warn("Impossible de mettre à jour Firebase, données locales conservées: {}", e.getMessage());
            }
        }

        return updatedUser;
    }

    /**
     * Vérifie si la connexion internet est disponible
     */
    private boolean isOnline() {
            try (Socket socket = new Socket()) {
                socket.connect(
                    new InetSocketAddress(
                        firebaseProps.getHost(),
                        firebaseProps.getPort()
                    ),
                    firebaseProps.getConnection().getTimeout()
                );
                return true;
            } catch (IOException e) {
                return false;
            }
        }

    /**
     * Synchronise les données Firebase vers la base locale pour le cache offline
     */
    private void syncToLocal(LoginRequest request, AuthResponse response) {
        try {
            // TODO: Implémenter la logique de synchronisation
            log.debug("Synchronisation des données vers la base locale");
        } catch (Exception e) {
            log.error("Erreur lors de la synchronisation locale: {}", e.getMessage());
        }
    }

    /**
     * Synchronise l'enregistrement vers la base locale
     */
        private void syncRegistrationToLocal(RegisterRequest request, AuthResponse response) {
            try {
                // TODO: Implémenter la logique de synchronisation
                log.debug("Synchronisation de l'enregistrement vers la base locale");
            } catch (Exception e) {
                log.error("Erreur lors de la synchronisation de l'enregistrement: {}", e.getMessage());
            }
        }

        public String generateOfflineToken(String uid, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("uid", uid);
        claims.put("email", email);
        claims.put("roles", "USER");  // ou récupérer les roles depuis la base

        // 1 heure d'expiration (3600000 ms)
        return JwtUtil.generateToken(claims, 3600000);
    }

    public void checkIfLocked(String username) {
    accountLockRepository.findByUsername(username).ifPresent(lock -> {
        if (lock.isLocked() && lock.getLockedUntil() != null
                && lock.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Compte bloqué temporairement jusqu'à " + lock.getLockedUntil());
        }
    });
}
}
