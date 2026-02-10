package com.projet.Cloud.controller;

import com.projet.Cloud.dto.AuthResponse;
import com.projet.Cloud.dto.LoginRequest;
import com.projet.Cloud.dto.RegisterRequest;
import com.projet.Cloud.dto.UpdateUserRequest;
import com.projet.Cloud.model.User;
import com.projet.Cloud.service.AuthService;
import com.projet.Cloud.service.AuthAttemptService;
import com.projet.Cloud.service.LocalAuthService;
import com.projet.Cloud.service.SyncService;
import com.projet.Cloud.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    private final AuthService authService;  // Injection du HybridAuthService (grâce à @Primary)
    private final SyncService syncService;
    private final LocalAuthService localAuthService;
    private final UserService userService;
    private final AuthAttemptService authAttemptService;

    @Autowired
    public AuthController(AuthService authService, SyncService syncService, LocalAuthService localAuthService, 
                          UserService userService, AuthAttemptService authAttemptService) {
        this.authService = authService;
        this.syncService = syncService;
        this.localAuthService = localAuthService; // Cast vers LocalAuthService
        this.userService = userService;
        this.authAttemptService = authAttemptService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Tentative de connexion pour: {}", request.getEmail());
        AuthResponse response = authService.authenticate(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Tentative d'enregistrement pour: {}", request.getEmail());
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/user/{id}")
    @PreAuthorize("hasRole('USER')") // JWT Auth requise
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        
        User updatedUser = localAuthService.updateUser(id, request);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Endpoint pour forcer la synchronisation manuelle
     * Synchronise bidirectionnellement Firebase ↔ PostgreSQL
     * POST /api/auth/sync
     */
    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> forceSync() {
        log.info("🔄 Synchronisation manuelle déclenchée (Firebase ↔ PostgreSQL bidirectionnelle)");
        try {
            syncService.forceSyncNow();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Synchronisation bidirectionnelle Firebase ↔ PostgreSQL terminée");
            response.put("timestamp", System.currentTimeMillis());
            response.put("status", "Terminée");
            response.put("direction", "Firebase → PostgreSQL ET PostgreSQL → Firebase");
            
            log.info("✅ Synchronisation bidirectionnelle lancée avec succès");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la synchronisation: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Erreur lors de la synchronisation");
            response.put("error", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Récupérer la liste de tous les utilisateurs
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        log.info("Récupération de la liste de tous les utilisateurs");
        List<User> users = userService.findAll();
        return ResponseEntity.ok(users);
    }

    /**
     * Récupérer les utilisateurs bloqués
     */
    @GetMapping("/users/blocked")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<User>> getBlockedUsers() {
        log.info("Récupération des utilisateurs bloqués");
        List<User> blockedUsers = userService.findBlockedUsers();
        return ResponseEntity.ok(blockedUsers);
    }

    /**
     * Débloquer un utilisateur
     */
    @PostMapping("/user/{id}/unblock")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> unlockUser(@PathVariable Long id) {
        log.info("Déblocage de l'utilisateur: {}", id);
        authAttemptService.unlockUser(id);
        return ResponseEntity.ok("Utilisateur débloqué avec succès");
    }
}