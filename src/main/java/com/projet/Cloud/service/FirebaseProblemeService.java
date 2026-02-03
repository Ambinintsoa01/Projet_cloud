package com.projet.Cloud.service;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
}
