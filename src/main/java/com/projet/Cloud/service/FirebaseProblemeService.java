package com.projet.Cloud.service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import com.projet.Cloud.model.Probleme;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@Slf4j
public class FirebaseProblemeService {

    /**
     * Récupère tous les problèmes depuis Firebase Firestore
     * Inclut l'ID du document Firebase pour la synchronisation
     */
    public List<Map<String, Object>> getAllProblemes() {
        try {
            Firestore firestore = FirestoreClient.getFirestore();
            QuerySnapshot querySnapshot = firestore.collection("problemes").get().get();

            List<Map<String, Object>> results = new ArrayList<>();
            for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                Map<String, Object> data = new HashMap<>(doc.getData());
                data.put("firebaseId", doc.getId()); // Ajouter l'ID du document
                results.add(data);
            }

            log.info("✅ {} problèmes récupérés depuis Firebase", results.size());
            return results;
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des problèmes Firebase: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Récupère les problèmes ouverts uniquement
     */
    public List<Map<String, Object>> getOpenProblemes() {
        try {
            Firestore firestore = FirestoreClient.getFirestore();
            QuerySnapshot querySnapshot = firestore.collection("problemes")
                    .whereEqualTo("status", "ouvert")
                    .get()
                    .get();

            List<Map<String, Object>> results = new ArrayList<>();
            for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                Map<String, Object> data = new HashMap<>(doc.getData());
                data.put("firebaseId", doc.getId());
                results.add(data);
            }

            log.info("✅ {} problèmes ouverts récupérés depuis Firebase", results.size());
            return results;
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des problèmes ouverts Firebase: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Créer un problème à partir d'un objet Probleme (pour synchronisation)
     */
    public String createProbleme(Probleme probleme) 
            throws ExecutionException, InterruptedException {
        
        log.info("Création problème dans Firestore depuis PostgreSQL (id={})", probleme.getId());
        
        Firestore firestore = FirestoreClient.getFirestore();
        
        Map<String, Object> problemeData = new HashMap<>();
        problemeData.put("userId", probleme.getUser().getId().toString());
        problemeData.put("firebaseUid", probleme.getUser().getFirebaseUid());
        problemeData.put("userEmail", probleme.getUser().getEmail());
        
        if (probleme.getType() != null) {
            problemeData.put("typeId", probleme.getType().getId().toString());
        }
        
        problemeData.put("latitude", probleme.getLatitude());
        problemeData.put("longitude", probleme.getLongitude());
        problemeData.put("description", probleme.getDescription());
        problemeData.put("status", probleme.getStatus() != null ? probleme.getStatus() : "ouvert");
        problemeData.put("createdAt", probleme.getCreatedAt());
        problemeData.put("updatedAt", probleme.getUpdatedAt());
        
        DocumentReference docRef = firestore.collection("problemes").document();
        docRef.set(problemeData).get();
        
        log.info("✅ Problème créé dans Firebase: {}", docRef.getId());
        return docRef.getId();
    }
    
    /**
     * Mettre à jour un problème à partir d'un objet Probleme (pour synchronisation)
     */
    public void updateProbleme(String firebaseId, Probleme probleme) 
            throws ExecutionException, InterruptedException {
        
        log.info("Mise à jour problème dans Firestore: {}", firebaseId);
        
        Firestore firestore = FirestoreClient.getFirestore();
        
        Map<String, Object> updates = new HashMap<>();
        updates.put("userId", probleme.getUser().getId().toString());
        updates.put("firebaseUid", probleme.getUser().getFirebaseUid());
        updates.put("userEmail", probleme.getUser().getEmail());
        
        if (probleme.getType() != null) {
            updates.put("typeId", probleme.getType().getId().toString());
        }
        
        updates.put("latitude", probleme.getLatitude());
        updates.put("longitude", probleme.getLongitude());
        updates.put("description", probleme.getDescription());
        updates.put("status", probleme.getStatus() != null ? probleme.getStatus() : "ouvert");
        updates.put("updatedAt", LocalDateTime.now());
        
        firestore.collection("problemes")
                .document(firebaseId)
                .update(updates)
                .get();
        
        log.info("✅ Problème mis à jour dans Firebase: {}", firebaseId);
    }
}
