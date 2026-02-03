package com.projet.Cloud.service;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.projet.Cloud.dto.CreateSignalementRequest;
import com.projet.Cloud.dto.SignalementTypeDto;
import com.projet.Cloud.dto.UpdateSignalementRequest;
import com.projet.Cloud.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FirebaseSignalementService {

    private final Firestore firestore;

    /**
     * Créer un signalement dans Firestore
     */
    public String createSignalement(CreateSignalementRequest request, Long userId, SignalementType type) 
            throws ExecutionException, InterruptedException {
        
        log.info("Création d'un signalement dans Firestore pour l'utilisateur: {}", userId);
        
        Map<String, Object> signalementData = new HashMap<>();
        signalementData.put("userId", userId.toString());
        signalementData.put("typeId", type.getId().toString());
        signalementData.put("latitude", request.getLatitude());
        signalementData.put("longitude", request.getLongitude());
        signalementData.put("description", request.getDescription());
        signalementData.put("surfaceM2", request.getSurfaceM2());
        signalementData.put("budget", request.getBudget());
        signalementData.put("status", "nouveau");
        signalementData.put("dateSignalement", FieldValue.serverTimestamp());
        signalementData.put("createdAt", FieldValue.serverTimestamp());
        signalementData.put("location", createLocationMap(request.getLatitude(), request.getLongitude()));
        signalementData.put("attachments", new ArrayList<>());
        signalementData.put("assignedTo", null);
        
        DocumentReference docRef = firestore.collection("signalements").document();
        docRef.set(signalementData).get();
        
        log.info("Signalement créé avec l'ID: {}", docRef.getId());
        return docRef.getId();
    }

    /**
     * Récupérer un signalement par ID
     */
    public Map<String, Object> getSignalementById(String signalementId) 
            throws ExecutionException, InterruptedException {
        
        DocumentSnapshot document = firestore.collection("signalements")
                .document(signalementId)
                .get()
                .get();
        
        if (document.exists()) {
            return document.getData();
        }
        return null;
    }

    /**
     * Récupérer tous les signalements
     */
    public List<Map<String, Object>> getAllSignalements() 
            throws ExecutionException, InterruptedException {
        
        QuerySnapshot querySnapshot = firestore.collection("signalements")
                .get()
                .get();
        
        return querySnapshot.getDocuments().stream()
                .map(document -> {
                    Map<String, Object> data = new HashMap<>(document.getData());
                    data.put("firebaseId", document.getId());
                    return data;
                })
                .collect(Collectors.toList());
    }

    /**
     * Récupérer les signalements d'un utilisateur
     */
    public List<Map<String, Object>> getSignalementsByUser(Long userId) 
            throws ExecutionException, InterruptedException {
        
        QuerySnapshot querySnapshot = firestore.collection("signalements")
                .whereEqualTo("userId", userId.toString())
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .get();
        
        return querySnapshot.getDocuments().stream()
                .map(DocumentSnapshot::getData)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer les signalements par statut
     */
    public List<Map<String, Object>> getSignalementsByStatus(String status) 
            throws ExecutionException, InterruptedException {
        
        QuerySnapshot querySnapshot = firestore.collection("signalements")
                .whereEqualTo("status", status)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .get();
        
        return querySnapshot.getDocuments().stream()
                .map(DocumentSnapshot::getData)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer les signalements par type
     */
    public List<Map<String, Object>> getSignalementsByType(Long typeId) 
            throws ExecutionException, InterruptedException {
        
        QuerySnapshot querySnapshot = firestore.collection("signalements")
                .whereEqualTo("typeId", typeId.toString())
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .get();
        
        return querySnapshot.getDocuments().stream()
                .map(DocumentSnapshot::getData)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer les signalements dans une zone géographique
     */
    public List<Map<String, Object>> getSignalementsByZone(Double minLat, Double maxLat, 
                                                           Double minLon, Double maxLon) 
            throws ExecutionException, InterruptedException {
        
        QuerySnapshot querySnapshot = firestore.collection("signalements")
                .whereGreaterThanOrEqualTo("latitude", minLat)
                .whereLessThanOrEqualTo("latitude", maxLat)
                .whereGreaterThanOrEqualTo("longitude", minLon)
                .whereLessThanOrEqualTo("longitude", maxLon)
                .get()
                .get();
        
        return querySnapshot.getDocuments().stream()
                .map(DocumentSnapshot::getData)
                .collect(Collectors.toList());
    }

    /**
     * Mettre à jour un signalement
     */
    public void updateSignalement(String signalementId, UpdateSignalementRequest request) 
            throws ExecutionException, InterruptedException {
        
        log.info("Mise à jour du signalement: {}", signalementId);
        
        Map<String, Object> updates = new HashMap<>();
        
        if (request.getDescription() != null) {
            updates.put("description", request.getDescription());
        }
        if (request.getStatus() != null) {
            updates.put("status", request.getStatus());
        }
        if (request.getSurfaceM2() != null) {
            updates.put("surfaceM2", request.getSurfaceM2());
        }
        if (request.getBudget() != null) {
            updates.put("budget", request.getBudget());
        }
        if (request.getEntrepriseConcernee() != null) {
            updates.put("entrepriseConcernee", request.getEntrepriseConcernee());
        }
        
        updates.put("updatedAt", FieldValue.serverTimestamp());
        
        firestore.collection("signalements")
                .document(signalementId)
                .update(updates)
                .get();
    }

    /**
     * Supprimer un signalement
     */
    public void deleteSignalement(String signalementId) 
            throws ExecutionException, InterruptedException {
        
        log.info("Suppression du signalement: {}", signalementId);
        firestore.collection("signalements")
                .document(signalementId)
                .delete()
                .get();
    }

    /**
     * Créer ou mettre à jour un type de signalement
     */
    public String createOrUpdateSignalementType(Long typeId, SignalementType type) 
            throws ExecutionException, InterruptedException {
        
        log.info("Création/mise à jour du type de signalement: {}", typeId);
        
        Map<String, Object> typeData = new HashMap<>();
        typeData.put("id", typeId);
        typeData.put("libelle", type.getLibelle());
        typeData.put("iconColor", type.getIconColor());
        typeData.put("iconSymbol", type.getIconSymbol());
        typeData.put("isActive", true);
        typeData.put("createdAt", FieldValue.serverTimestamp());
        
        firestore.collection("signalementTypes")
                .document(typeId.toString())
                .set(typeData, SetOptions.merge())
                .get();
        
        return typeId.toString();
    }

    /**
     * Récupérer tous les types de signalements
     */
    public List<Map<String, Object>> getAllSignalementTypes() 
            throws ExecutionException, InterruptedException {
        
        QuerySnapshot querySnapshot = firestore.collection("signalementTypes")
                .whereEqualTo("isActive", true)
                .get()
                .get();
        
        return querySnapshot.getDocuments().stream()
                .map(DocumentSnapshot::getData)
                .collect(Collectors.toList());
    }

    /**
     * Créer ou mettre à jour un utilisateur
     */
    public String createOrUpdateUser(Long userId, User user) 
            throws ExecutionException, InterruptedException {
        
        log.info("Création/mise à jour de l'utilisateur dans Firebase: {}", userId);
        
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", userId);
        userData.put("username", user.getUsername());
        userData.put("email", user.getEmail());
        userData.put("firebaseUid", user.getFirebaseUid());
        userData.put("roles", user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList()));
        userData.put("isActive", true);
        userData.put("createdAt", FieldValue.serverTimestamp());
        
        firestore.collection("users")
                .document(userId.toString())
                .set(userData, SetOptions.merge())
                .get();
        
        return userId.toString();
    }

    /**
     * Récupérer un utilisateur par ID
     */
    public Map<String, Object> getUserById(Long userId) 
            throws ExecutionException, InterruptedException {
        
        DocumentSnapshot document = firestore.collection("users")
                .document(userId.toString())
                .get()
                .get();
        
        if (document.exists()) {
            return document.getData();
        }
        return null;
    }

    /**
     * Ajouter un commentaire à un signalement
     */
    public void addCommentToSignalement(String signalementId, Long userId, String commentText) 
            throws ExecutionException, InterruptedException {
        
        Map<String, Object> comment = new HashMap<>();
        comment.put("userId", userId.toString());
        comment.put("text", commentText);
        comment.put("createdAt", FieldValue.serverTimestamp());
        
        firestore.collection("signalements")
                .document(signalementId)
                .collection("comments")
                .add(comment)
                .get();
    }

    /**
     * Ajouter une pièce jointe (photo/document) à un signalement
     */
    public void addAttachmentToSignalement(String signalementId, String url, String type) 
            throws ExecutionException, InterruptedException {
        
        Map<String, Object> attachment = new HashMap<>();
        attachment.put("url", url);
        attachment.put("type", type); // image, video, document
        attachment.put("uploadedAt", FieldValue.serverTimestamp());
        
        firestore.collection("signalements")
                .document(signalementId)
                .update("attachments", FieldValue.arrayUnion(attachment))
                .get();
    }

    /**
     * Récupérer les statistiques du jour
     */
    public Map<String, Object> getDailyStatistics() 
            throws ExecutionException, InterruptedException {
        
        QuerySnapshot querySnapshot = firestore.collection("statistics")
                .orderBy("date", Query.Direction.DESCENDING)
                .limit(1)
                .get()
                .get();
        
        if (!querySnapshot.isEmpty()) {
            return querySnapshot.getDocuments().get(0).getData();
        }
        return new HashMap<>();
    }

    /**
     * Enregistrer une tentative de connexion
     */
    public void logLoginAttempt(String email, boolean success, String ipAddress, String userAgent) 
            throws ExecutionException, InterruptedException {
        
        Map<String, Object> attempt = new HashMap<>();
        attempt.put("email", email);
        attempt.put("success", success);
        attempt.put("attemptAt", FieldValue.serverTimestamp());
        attempt.put("ipAddress", ipAddress);
        attempt.put("userAgent", userAgent);
        
        if (!success) {
            attempt.put("failureReason", "Invalid credentials");
        }
        
        firestore.collection("loginAttempts")
                .add(attempt)
                .get();
    }

    /**
     * Créer une session utilisateur
     */
    public String createSession(Long userId, String firebaseToken, String refreshToken, String ipAddress) 
            throws ExecutionException, InterruptedException {
        
        Map<String, Object> session = new HashMap<>();
        session.put("userId", userId.toString());
        session.put("firebaseToken", firebaseToken);
        session.put("refreshToken", refreshToken);
        session.put("loginAt", FieldValue.serverTimestamp());
        session.put("ipAddress", ipAddress);
        session.put("isActive", true);
        session.put("lastActivityAt", FieldValue.serverTimestamp());
        
        DocumentReference docRef = firestore.collection("sessions")
                .add(session)
                .get();
        
        return docRef.getId();
    }

    /**
     * Créer un helper pour mapper la localisation
     */
    private Map<String, Object> createLocationMap(Double latitude, Double longitude) {
        Map<String, Object> location = new HashMap<>();
        Map<String, Double> coordinates = new HashMap<>();
        coordinates.put("latitude", latitude);
        coordinates.put("longitude", longitude);
        location.put("coordinates", coordinates);
        location.put("address", "");
        location.put("city", "");
        return location;
    }

    /**
     * Batch write pour opérations multiples
     */
    public void batchWriteSignalements(List<Map<String, Object>> signalements) 
            throws ExecutionException, InterruptedException {
        
        WriteBatch batch = firestore.batch();
        
        for (Map<String, Object> signalementData : signalements) {
            DocumentReference docRef = firestore.collection("signalements").document();
            signalementData.put("createdAt", FieldValue.serverTimestamp());
            batch.set(docRef, signalementData);
        }
        
        batch.commit().get();
    }
}
