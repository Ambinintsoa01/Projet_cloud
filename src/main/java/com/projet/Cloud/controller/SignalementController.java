package com.projet.Cloud.controller;

import com.projet.Cloud.dto.CreateSignalementRequest;
import com.projet.Cloud.dto.UpdateSignalementRequest;
import com.projet.Cloud.model.Signalement;
import com.projet.Cloud.service.SignalementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
@Slf4j
public class SignalementController {

    private final SignalementService signalementService;

    /**
     * Créer un nouveau signalement
     */
    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Signalement> createSignalement(
            @Valid @RequestBody CreateSignalementRequest request,
            Authentication authentication) {
        log.info("Création d'un nouveau signalement");
        
        // Récupérer l'ID utilisateur depuis le token JWT
        String userEmail = authentication.getName();
        Long userId = extractUserIdFromAuthentication(authentication);
        
        Signalement signalement = signalementService.createSignalement(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(signalement);
    }

    /**
     * Récupérer tous les signalements
     */
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Signalement>> getAllSignalements() {
        log.info("Récupération de tous les signalements");
        List<Signalement> signalements = signalementService.getAllSignalements();
        return ResponseEntity.ok(signalements);
    }

    /**
     * Récupérer un signalement par ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Signalement> getSignalementById(@PathVariable Long id) {
        log.info("Récupération du signalement: {}", id);
        return signalementService.getSignalementById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Récupérer les signalements de l'utilisateur connecté
     */
    @GetMapping("/user/me")
    @PreAuthorize("hasRole('USER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Signalement>> getMySignalements(Authentication authentication) {
        log.info("Récupération des signalements de l'utilisateur connecté");
        Long userId = extractUserIdFromAuthentication(authentication);
        List<Signalement> signalements = signalementService.getSignalementsByUser(userId);
        return ResponseEntity.ok(signalements);
    }

    /**
     * Récupérer les signalements par statut
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Signalement>> getSignalementsByStatus(@PathVariable String status) {
        log.info("Récupération des signalements par statut: {}", status);
        List<Signalement> signalements = signalementService.getSignalementsByStatus(status);
        return ResponseEntity.ok(signalements);
    }

    /**
     * Récupérer les signalements par type
     */
    @GetMapping("/type/{typeId}")
    @PreAuthorize("hasRole('USER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Signalement>> getSignalementsByType(@PathVariable Long typeId) {
        log.info("Récupération des signalements par type: {}", typeId);
        List<Signalement> signalements = signalementService.getSignalementsByType(typeId);
        return ResponseEntity.ok(signalements);
    }

    /**
     * Récupérer les signalements par zone géographique
     */
    @GetMapping("/zone")
    @PreAuthorize("hasRole('USER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Signalement>> getSignalementsByZone(
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLon,
            @RequestParam Double maxLon) {
        log.info("Récupération des signalements par zone");
        List<Signalement> signalements = signalementService.getSignalementsByZone(minLat, maxLat, minLon, maxLon);
        return ResponseEntity.ok(signalements);
    }

    /**
     * Récupérer les signalements non résolus
     */
    @GetMapping("/unresolved")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Signalement>> getUnresolvedSignalements() {
        log.info("Récupération des signalements non résolus");
        List<Signalement> signalements = signalementService.getUnresolvedSignalements();
        return ResponseEntity.ok(signalements);
    }

    /**
     * Mettre à jour un signalement
     */
    @PutMapping("/{id}")
    public ResponseEntity<Signalement> updateSignalement(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSignalementRequest request) {
        log.info("Mise à jour du signalement: {}", id);
        Signalement signalement = signalementService.updateSignalement(id, request);
        return ResponseEntity.ok(signalement);
    }

    /**
     * Supprimer un signalement
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSignalement(@PathVariable Long id) {
        log.info("Suppression du signalement: {}", id);
        signalementService.deleteSignalement(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Récupérer les statistiques
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<SignalementService.SignalementStats> getStats() {
        log.info("Récupération des statistiques");
        SignalementService.SignalementStats stats = signalementService.getStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Méthode utilitaire pour extraire l'ID utilisateur du token JWT
     */
    private Long extractUserIdFromAuthentication(Authentication authentication) {
        // Vous devrez implémenter cela en fonction de votre configuration JWT
        // Pour l'instant, retournez une valeur par défaut
        // À adapter selon votre structure JWT
        try {
            // Supposer que l'objet principal contient l'ID utilisateur
            Object principal = authentication.getPrincipal();
            // À adapter selon votre structure
            return 1L; // Placeholder
        } catch (Exception e) {
            log.error("Erreur lors de l'extraction de l'ID utilisateur", e);
            return null;
        }
    }
}
