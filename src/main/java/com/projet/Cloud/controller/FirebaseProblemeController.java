package com.projet.Cloud.controller;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.projet.Cloud.dto.ConvertProblemeRequest;
import com.projet.Cloud.dto.ProblemeWithUserDTO;
import com.projet.Cloud.model.User;
import com.projet.Cloud.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/firebase/problemes")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class FirebaseProblemeController {

    private final UserRepository userRepository;

    private ProblemeWithUserDTO enrichProblemeWithUser(Map<String, Object> problemeData, String problemeId) {
        try {
            log.info("🔍 Enrichissement du problème {} avec données utilisateur", problemeId);
            
            ProblemeWithUserDTO dto = new ProblemeWithUserDTO();
            
            dto.setId(problemeId);
            dto.setUserId(toLong(problemeData.get("userId")));
            dto.setLatitude(toDouble(problemeData.get("latitude")));
            dto.setLongitude(toDouble(problemeData.get("longitude")));
            dto.setDescription((String) problemeData.get("description"));
            Object typeIdObj = problemeData.get("typeId");
            if (typeIdObj != null) {
                if (typeIdObj instanceof Number) {
                    dto.setTypeId(String.valueOf(((Number) typeIdObj).longValue()));
                } else {
                    dto.setTypeId((String) typeIdObj);
                }
            }
            dto.setStatus((String) problemeData.get("status"));
            dto.setCreatedAt(problemeData.get("createdAt"));  // Garder l'objet tel quel pour JSON
            dto.setUpdatedAt(problemeData.get("updatedAt"));  // Garder l'objet tel quel pour JSON
            
            Long userId = dto.getUserId();
            log.info("   UserId trouvé: {}", userId);
            
            if (userId != null) {
                Optional<User> userOpt = userRepository.findById(userId);
                log.info("   Recherche utilisateur {} dans PostgreSQL: {}", userId, userOpt.isPresent());
                
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    dto.setUser(ProblemeWithUserDTO.UserInfo.builder()
                            .id(user.getId())
                            .email(user.getEmail())
                            .fullName(user.getUsername())
                            .username(user.getUsername())
                            .build());
                    log.info("   ✅ Utilisateur enrichi: {}", user.getUsername());
                }
            }
            
            log.info("   ✅ Problème {} enrichi avec succès", problemeId);
            return dto;
            
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'enrichissement du problème {}: {}", problemeId, e.getMessage(), e);
            throw new RuntimeException("Erreur enrichissement problème " + problemeId, e);
        }
    }

    private Long toLong(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).longValue();
        if (obj instanceof String) return Long.parseLong((String) obj);
        return null;
    }

    private Double toDouble(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).doubleValue();
        if (obj instanceof String) return Double.parseDouble((String) obj);
        return null;
    }

    @GetMapping("/ouverts")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<ProblemeWithUserDTO>> listerProblemesOuverts() {
        try {
            log.info("📋 Récupération des problèmes ouverts depuis Firestore");
            Firestore firestore = FirestoreClient.getFirestore();
            
            QuerySnapshot querySnapshot = firestore.collection("problemes")
                    .whereEqualTo("status", "ouvert")
                    .get()
                    .get();

            List<ProblemeWithUserDTO> problemes = new ArrayList<>();
            for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                try {
                    ProblemeWithUserDTO dto = enrichProblemeWithUser(doc.getData(), doc.getId());
                    problemes.add(dto);
                } catch (Exception e) {
                    log.error("❌ Erreur enrichissement problème {}: {}", doc.getId(), e.getMessage(), e);
                }
            }

            log.info("✅ {} problèmes ouverts trouvés", problemes.size());
            return ResponseEntity.ok(problemes);
            
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des problèmes: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<ProblemeWithUserDTO>> listerProblemes() {
        try {
            log.info("📋 Récupération de tous les problèmes depuis Firestore");
            Firestore firestore = FirestoreClient.getFirestore();
            
            QuerySnapshot querySnapshot = firestore.collection("problemes").get().get();

            List<ProblemeWithUserDTO> problemes = new ArrayList<>();
            for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                ProblemeWithUserDTO dto = enrichProblemeWithUser(doc.getData(), doc.getId());
                problemes.add(dto);
            }

            log.info("✅ {} problèmes trouvés", problemes.size());
            return ResponseEntity.ok(problemes);
            
        } catch (InterruptedException | ExecutionException e) {
            log.error("❌ Erreur lors de la récupération des problèmes: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ProblemeWithUserDTO> getProbleme(@PathVariable String id) {
        try {
            log.info("🔍 Récupération du problème {} depuis Firestore", id);
            Firestore firestore = FirestoreClient.getFirestore();
            
            DocumentSnapshot doc = firestore.collection("problemes").document(id).get().get();

            if (!doc.exists()) {
                log.warn("⚠️ Problème {} introuvable", id);
                return ResponseEntity.notFound().build();
            }

            ProblemeWithUserDTO dto = enrichProblemeWithUser(doc.getData(), doc.getId());
            log.info("✅ Problème {} récupéré", id);
            return ResponseEntity.ok(dto);
            
        } catch (InterruptedException | ExecutionException e) {
            log.error("❌ Erreur lors de la récupération du problème: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String newStatus = request.get("status");
            log.info("🔄 Mise à jour du statut du problème {} → {}", id, newStatus);
            
            Firestore firestore = FirestoreClient.getFirestore();
            DocumentReference docRef = firestore.collection("problemes").document(id);
            
            DocumentSnapshot doc = docRef.get().get();
            if (!doc.exists()) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> updates = new HashMap<>();
            updates.put("status", newStatus);
            updates.put("updatedAt", FieldValue.serverTimestamp());
            
            docRef.update(updates).get();

            Map<String, Object> probleme = new HashMap<>(doc.getData());
            probleme.put("id", doc.getId());
            probleme.put("status", newStatus);

            log.info("✅ Statut du problème {} mis à jour", id);
            return ResponseEntity.ok(probleme);
            
        } catch (InterruptedException | ExecutionException e) {
            log.error("❌ Erreur lors de la mise à jour du statut: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> convertirProbleme(
            @PathVariable String id,
            @Valid @RequestBody ConvertProblemeRequest request,
            Authentication authentication) {
        try {
            log.info("🔄 Conversion du problème Firestore {} en signalement", id);
            
            Firestore firestore = FirestoreClient.getFirestore();
            
            // 1. Récupérer le problème depuis Firestore
            DocumentSnapshot problemeDoc = firestore.collection("problemes").document(id).get().get();
            if (!problemeDoc.exists()) {
                log.warn("⚠️ Problème {} introuvable", id);
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> problemeData = problemeDoc.getData();
            
            // 2. Récupérer l'ID du manager
            String managerEmail = authentication.getName();
            Long managerId = userRepository.findByEmail(managerEmail)
                    .map(User::getId)
                    .orElseThrow(() -> new RuntimeException("Manager introuvable"));
            
            log.info("   Manager: {} (ID: {})", managerEmail, managerId);
            
            // 3. Créer le signalement dans Firestore
            Map<String, Object> signalementData = new HashMap<>();
            signalementData.put("userId", problemeData.get("userId"));
            signalementData.put("latitude", problemeData.get("latitude"));
            signalementData.put("longitude", problemeData.get("longitude"));
            signalementData.put("description", request.getDescription());
            signalementData.put("typeId", request.getTypeId().toString());
            signalementData.put("surfaceM2", request.getSurfaceM2());
            signalementData.put("budget", request.getBudget());
            signalementData.put("status", "en_attente");
            signalementData.put("managerId", managerId);
            signalementData.put("problemeId", id); // Référence au problème d'origine
            signalementData.put("createdAt", FieldValue.serverTimestamp());
            signalementData.put("updatedAt", FieldValue.serverTimestamp());
            
            DocumentReference signalementRef = firestore.collection("signalements").document();
            signalementRef.set(signalementData).get();
            
            log.info("   ✅ Signalement créé: {}", signalementRef.getId());
            
            // 4. Mettre à jour le statut du problème à "converti"
            Map<String, Object> updates = new HashMap<>();
            updates.put("status", "converti");
            updates.put("signalementId", signalementRef.getId());
            updates.put("updatedAt", FieldValue.serverTimestamp());
            
            firestore.collection("problemes").document(id).update(updates).get();
            
            log.info("✅ Problème {} converti en signalement {}", id, signalementRef.getId());
            
            // 5. Retourner le signalement créé
            Map<String, Object> response = new HashMap<>();
            response.put("id", signalementRef.getId());
            response.put("userId", problemeData.get("userId"));
            response.put("latitude", problemeData.get("latitude"));
            response.put("longitude", problemeData.get("longitude"));
            response.put("description", request.getDescription());
            response.put("typeId", request.getTypeId().toString());
            response.put("surfaceM2", request.getSurfaceM2());
            response.put("budget", request.getBudget());
            response.put("status", "en_attente");
            response.put("managerId", managerId);
            response.put("problemeId", id);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            log.error("❌ Erreur lors de la conversion du problème {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

}
