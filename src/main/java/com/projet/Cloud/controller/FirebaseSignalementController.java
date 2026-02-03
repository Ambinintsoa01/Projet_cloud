package com.projet.Cloud.controller;

import com.projet.Cloud.dto.CreateSignalementRequest;
import com.projet.Cloud.dto.UpdateSignalementRequest;
import com.projet.Cloud.service.FirebaseSignalementService;
import com.projet.Cloud.service.SignalementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/firebase")
@RequiredArgsConstructor
@Slf4j
public class FirebaseSignalementController {

    private final FirebaseSignalementService firebaseService;
    private final SignalementService signalementService;

    /**
     * Créer un signalement dans Firebase
     */
    @PostMapping("/signalements")
    public ResponseEntity<Map<String, String>> createSignalement(
            @RequestBody CreateSignalementRequest request) {
        try {
            Long userId = getCurrentUserId(); // À implémenter selon votre système d'auth
            
            var signalementType = signalementService.getSignalementById(request.getTypeId())
                    .orElseThrow(() -> new RuntimeException("Type non trouvé"));
            
            String docId = firebaseService.createSignalement(request, userId, null);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("id", docId, "message", "Signalement créé avec succès"));
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de la création du signalement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la création"));
        }
    }

    /**
     * Récupérer tous les signalements
     */
    @GetMapping("/signalements")
    public ResponseEntity<List<Map<String, Object>>> getAllSignalements() {
        try {
            List<Map<String, Object>> signalements = firebaseService.getAllSignalements();
            return ResponseEntity.ok(signalements);
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de la récupération des signalements", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupérer un signalement par ID
     */
    @GetMapping("/signalements/{id}")
    public ResponseEntity<Map<String, Object>> getSignalementById(@PathVariable String id) {
        try {
            Map<String, Object> signalement = firebaseService.getSignalementById(id);
            if (signalement != null) {
                return ResponseEntity.ok(signalement);
            }
            return ResponseEntity.notFound().build();
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de la récupération du signalement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupérer les signalements d'un utilisateur
     */
    @GetMapping("/signalements/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getSignalementsByUser(@PathVariable Long userId) {
        try {
            List<Map<String, Object>> signalements = firebaseService.getSignalementsByUser(userId);
            return ResponseEntity.ok(signalements);
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de la récupération des signalements de l'utilisateur", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupérer les signalements par statut
     */
    @GetMapping("/signalements/status/{status}")
    public ResponseEntity<List<Map<String, Object>>> getSignalementsByStatus(@PathVariable String status) {
        try {
            List<Map<String, Object>> signalements = firebaseService.getSignalementsByStatus(status);
            return ResponseEntity.ok(signalements);
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de la récupération des signalements par statut", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupérer les signalements par type
     */
    @GetMapping("/signalements/type/{typeId}")
    public ResponseEntity<List<Map<String, Object>>> getSignalementsByType(@PathVariable Long typeId) {
        try {
            List<Map<String, Object>> signalements = firebaseService.getSignalementsByType(typeId);
            return ResponseEntity.ok(signalements);
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de la récupération des signalements par type", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupérer les signalements dans une zone géographique
     */
    @GetMapping("/signalements/zone")
    public ResponseEntity<List<Map<String, Object>>> getSignalementsByZone(
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLon,
            @RequestParam Double maxLon) {
        try {
            List<Map<String, Object>> signalements = firebaseService.getSignalementsByZone(minLat, maxLat, minLon, maxLon);
            return ResponseEntity.ok(signalements);
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de la récupération des signalements par zone", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mettre à jour un signalement
     */
    @PutMapping("/signalements/{id}")
    public ResponseEntity<Map<String, String>> updateSignalement(
            @PathVariable String id,
            @RequestBody UpdateSignalementRequest request) {
        try {
            firebaseService.updateSignalement(id, request);
            return ResponseEntity.ok(Map.of("message", "Signalement mis à jour avec succès"));
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de la mise à jour du signalement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la mise à jour"));
        }
    }

    /**
     * Supprimer un signalement
     */
    @DeleteMapping("/signalements/{id}")
    public ResponseEntity<Map<String, String>> deleteSignalement(@PathVariable String id) {
        try {
            firebaseService.deleteSignalement(id);
            return ResponseEntity.ok(Map.of("message", "Signalement supprimé avec succès"));
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de la suppression du signalement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la suppression"));
        }
    }

    /**
     * Récupérer tous les types de signalements
     */
    @GetMapping("/types")
    public ResponseEntity<List<Map<String, Object>>> getAllSignalementTypes() {
        try {
            List<Map<String, Object>> types = firebaseService.getAllSignalementTypes();
            return ResponseEntity.ok(types);
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de la récupération des types", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Ajouter un commentaire à un signalement
     */
    @PostMapping("/signalements/{id}/comments")
    public ResponseEntity<Map<String, String>> addComment(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        try {
            Long userId = getCurrentUserId();
            String comment = payload.get("text");
            
            firebaseService.addCommentToSignalement(id, userId, comment);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Commentaire ajouté avec succès"));
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de l'ajout du commentaire", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'ajout du commentaire"));
        }
    }

    /**
     * Ajouter une pièce jointe
     */
    @PostMapping("/signalements/{id}/attachments")
    public ResponseEntity<Map<String, String>> addAttachment(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        try {
            String url = payload.get("url");
            String type = payload.get("type");
            
            firebaseService.addAttachmentToSignalement(id, url, type);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Pièce jointe ajoutée avec succès"));
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de l'ajout de la pièce jointe", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de l'ajout de la pièce jointe"));
        }
    }

    /**
     * Récupérer les statistiques
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        try {
            Map<String, Object> stats = firebaseService.getDailyStatistics();
            return ResponseEntity.ok(stats);
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de la récupération des statistiques", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Méthode helper pour obtenir l'ID utilisateur courant
     * À adapter selon votre système d'authentification
     */
    private Long getCurrentUserId() {
        // TODO: Implémenter la récupération de l'utilisateur courant
        // À partir de SecurityContext ou du JWT token
        return 1L; // Valeur par défaut pour la démo
    }
}
