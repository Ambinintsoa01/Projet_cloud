package com.projet.Cloud.service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class FirestoreInitializationService {

    private final Firestore firestore;

    /**
     * Initialise les collections Firestore au démarrage de l'application
     */
    @EventListener(ApplicationReadyEvent.class)
    public void initializeFirestoreCollections() {
        log.info("🌱 Initialisation des collections Firestore...");
        
        try {
            initializeProblemes();
            initializeSignalements();
            log.info("✅ Collections Firestore initialisées avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'initialisation des collections Firestore", e);
        }
    }

    /**
     * Initialise la collection "problemes"
     */
    private void initializeProblemes() throws ExecutionException, InterruptedException {
        QuerySnapshot snapshot = firestore.collection("problemes").limit(1).get().get();
        
        if (snapshot.isEmpty()) {
            log.info("📝 Création de la collection 'problemes' avec un document exemple...");
            
            Map<String, Object> exampleProbleme = new HashMap<>();
            exampleProbleme.put("userId", "example-user");
            exampleProbleme.put("latitude", -18.8792);
            exampleProbleme.put("longitude", 47.5079);
            exampleProbleme.put("description", "Exemple de problème - à supprimer");
            exampleProbleme.put("typeId", null);
            exampleProbleme.put("status", "ouvert");
            exampleProbleme.put("createdAt", FieldValue.serverTimestamp());
            exampleProbleme.put("updatedAt", FieldValue.serverTimestamp());
            exampleProbleme.put("_isExample", true);
            
            DocumentReference docRef = firestore.collection("problemes").document("example");
            docRef.set(exampleProbleme).get();
            
            log.info("✅ Collection 'problemes' créée avec succès");
        } else {
            log.info("✅ Collection 'problemes' existe déjà ({} documents)", snapshot.size());
        }
    }

    /**
     * Initialise la collection "signalements"
     */
    private void initializeSignalements() throws ExecutionException, InterruptedException {
        QuerySnapshot snapshot = firestore.collection("signalements").limit(1).get().get();
        
        if (snapshot.isEmpty()) {
            log.info("📝 Création de la collection 'signalements' avec un document exemple...");
            
            Map<String, Object> exampleSignalement = new HashMap<>();
            exampleSignalement.put("latitude", -18.8792);
            exampleSignalement.put("longitude", 47.5079);
            exampleSignalement.put("typeId", "1");
            exampleSignalement.put("description", "Exemple de signalement - à supprimer");
            exampleSignalement.put("surfaceM2", 25);
            exampleSignalement.put("budget", 5000);
            exampleSignalement.put("entrepriseConcernee", null);
            exampleSignalement.put("isAnonymous", false);
            exampleSignalement.put("status", "nouveau");
            exampleSignalement.put("userId", "example-manager");
            exampleSignalement.put("createdBy", "system");
            exampleSignalement.put("createdAt", FieldValue.serverTimestamp());
            exampleSignalement.put("updatedAt", FieldValue.serverTimestamp());
            exampleSignalement.put("_isExample", true);
            
            DocumentReference docRef = firestore.collection("signalements").document("example");
            docRef.set(exampleSignalement).get();
            
            log.info("✅ Collection 'signalements' créée avec succès");
        } else {
            log.info("✅ Collection 'signalements' existe déjà ({} documents)", snapshot.size());
        }
    }

    /**
     * Endpoint manuel pour forcer l'initialisation
     * Peut être appelé via /api/admin/init-firestore
     */
    public Map<String, Object> manualInitialization() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            initializeProblemes();
            initializeSignalements();
            
            result.put("success", true);
            result.put("message", "Collections Firestore initialisées avec succès");
            result.put("collections", new String[]{"problemes", "signalements"});
            
        } catch (Exception e) {
            log.error("Erreur lors de l'initialisation manuelle", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
}
