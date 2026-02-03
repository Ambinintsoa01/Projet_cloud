package com.projet.Cloud.controller;

import com.projet.Cloud.service.AuthAttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthAdminController {

    private final AuthAttemptService authAttemptService;

    /**
     * Débloquer un utilisateur
     */
    @PostMapping("/unlock/{userId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> unlockUser(@PathVariable Long userId) {

        authAttemptService.unlockUser(userId);
        return ResponseEntity.ok("Utilisateur débloqué avec succès");
    }
}
