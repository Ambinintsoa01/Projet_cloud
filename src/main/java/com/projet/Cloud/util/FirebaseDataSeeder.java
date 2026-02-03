package com.projet.Cloud.util;

import com.google.cloud.firestore.*;
import com.projet.Cloud.model.SignalementType;
import com.projet.Cloud.model.User;
import com.projet.Cloud.repository.SignalementTypeRepository;
import com.projet.Cloud.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Component
@RequiredArgsConstructor
@Slf4j
public class FirebaseDataSeeder {

    private final Firestore firestore;
    private final SignalementTypeRepository signalementTypeRepository;
    private final UserRepository userRepository;

    /**
     * Initialiser les données Firebase au démarrage
     */
    @EventListener(ApplicationReadyEvent.class)
    public void seedFirebaseData() {
        try {
            log.info("🚀 Démarrage du seeding des données Firebase");
            
            seedSignalementTypes();
            seedRoles();
            seedUsers();
            seedProblemes();
            seedSignalements();
            
            log.info("✅ Seeding terminé avec succès");
        } catch (ExecutionException | InterruptedException e) {
            log.error("❌ Erreur lors du seeding Firebase: ", e);
        }
    }

    /**
     * Initialiser les types de signalements
     */
    private void seedSignalementTypes() throws ExecutionException, InterruptedException {
        log.info("📝 Initialisation des types de signalements...");

        // Vérifier si les types existent déjà
        QuerySnapshot existing = firestore.collection("signalementTypes")
                .get()
                .get();

        if (!existing.isEmpty()) {
            log.info("✓ Types de signalements déjà présents");
            return;
        }

        // Types de signalements
        List<Map<String, Object>> types = new ArrayList<>();

        types.add(createSignalementType(1L, "Nid de poule", "#FF4444", "⚠️"));
        types.add(createSignalementType(2L, "Inondation", "#0088FF", "🌊"));
        types.add(createSignalementType(3L, "Dégradation route", "#FF8800", "🛣️"));
        types.add(createSignalementType(4L, "Éclairage défaillant", "#FFFF00", "💡"));
        types.add(createSignalementType(5L, "Signalisation manquante", "#00CC00", "⛔"));
        types.add(createSignalementType(6L, "Obstruction trottoir", "#AA00FF", "🚧"));
        types.add(createSignalementType(7L, "Problème canalisation", "#8B4513", "💧"));
        types.add(createSignalementType(8L, "Détritus/Pollution", "#666666", "♻️"));
        types.add(createSignalementType(9L, "Circulation dangereuse", "#DD0000", "🚗"));
        types.add(createSignalementType(10L, "Autre", "#999999", "❓"));

        WriteBatch batch = firestore.batch();
        for (Map<String, Object> typeData : types) {
            Long typeId = (Long) typeData.get("id");
            DocumentReference docRef = firestore.collection("signalementTypes")
                    .document(typeId.toString());
            batch.set(docRef, typeData);
        }
        batch.commit().get();

        log.info("✓ {} types de signalements créés", types.size());
    }

    /**
     * Initialiser les rôles
     */
    private void seedRoles() throws ExecutionException, InterruptedException {
        log.info("👥 Initialisation des rôles...");

        QuerySnapshot existing = firestore.collection("roles")
                .get()
                .get();

        if (!existing.isEmpty()) {
            log.info("✓ Rôles déjà présents");
            return;
        }

        WriteBatch batch = firestore.batch();

        // Rôle Admin
        batch.set(
            firestore.collection("roles").document("admin"),
            createRole("admin", "Administrateur système", Arrays.asList(
                "read:signalements",
                "create:signalements",
                "update:signalements",
                "delete:signalements",
                "manage:users",
                "manage:roles",
                "view:statistics"
            ))
        );

        // Rôle Moderateur
        batch.set(
            firestore.collection("roles").document("moderateur"),
            createRole("moderateur", "Modérateur de signalements", Arrays.asList(
                "read:signalements",
                "create:signalements",
                "update:signalements",
                "moderate:content",
                "view:statistics"
            ))
        );

        // Rôle User
        batch.set(
            firestore.collection("roles").document("user"),
            createRole("user", "Utilisateur standard", Arrays.asList(
                "read:signalements",
                "create:signalements",
                "update:own_signalements",
                "view:own_data"
            ))
        );

        batch.commit().get();
        log.info("✓ 3 rôles créés");
    }

    /**
     * Synchroniser les utilisateurs de la BD SQL vers Firebase
     */
    private void seedUsers() throws ExecutionException, InterruptedException {
        log.info("👤 Synchronisation des utilisateurs vers Firebase...");

        List<User> users = userRepository.findAll();

        if (users.isEmpty()) {
            log.info("Aucun utilisateur à synchroniser");
            return;
        }

        WriteBatch batch = firestore.batch();
        int count = 0;

        for (User user : users) {
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("email", user.getEmail());
            userData.put("firebaseUid", user.getFirebaseUid() != null ? user.getFirebaseUid() : "");
            userData.put("roles", user.getRoles().stream()
                    .map(role -> role.getName())
                    .toList());
            userData.put("isActive", true);
            userData.put("createdAt", user.getCreatedAt());

            DocumentReference docRef = firestore.collection("users")
                    .document(user.getId().toString());
            batch.set(docRef, userData, SetOptions.merge());
            count++;

            if (count % 100 == 0) {
                batch.commit().get();
                batch = firestore.batch();
            }
        }

        if (count % 100 != 0) {
            batch.commit().get();
        }

        log.info("✓ {} utilisateurs synchronisés", count);
    }

    /**
     * Initialiser la collection problemes
     */
    private void seedProblemes() throws ExecutionException, InterruptedException {
        log.info("📝 Initialisation de la collection 'problemes'...");

        QuerySnapshot existing = firestore.collection("problemes")
                .limit(1)
                .get()
                .get();

        if (!existing.isEmpty()) {
            log.info("✓ Collection 'problemes' existe déjà ({} documents)", existing.size());
            return;
        }

        // Créer un document exemple pour initialiser la collection
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

        firestore.collection("problemes")
                .document("example")
                .set(exampleProbleme)
                .get();

        log.info("✓ Collection 'problemes' créée avec un document exemple");
    }

    /**
     * Initialiser la collection signalements
     */
    private void seedSignalements() throws ExecutionException, InterruptedException {
        log.info("📝 Initialisation de la collection 'signalements'...");

        QuerySnapshot existing = firestore.collection("signalements")
                .limit(1)
                .get()
                .get();

        if (!existing.isEmpty()) {
            log.info("✓ Collection 'signalements' existe déjà ({} documents)", existing.size());
            return;
        }

        // Créer un document exemple pour initialiser la collection
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

        firestore.collection("signalements")
                .document("example")
                .set(exampleSignalement)
                .get();

        log.info("✓ Collection 'signalements' créée avec un document exemple");
    }

    /**
     * Helper pour créer un type de signalement
     */
    private Map<String, Object> createSignalementType(Long id, String libelle, 
                                                       String iconColor, String iconSymbol) {
        Map<String, Object> type = new HashMap<>();
        type.put("id", id);
        type.put("libelle", libelle);
        type.put("iconColor", iconColor);
        type.put("iconSymbol", iconSymbol);
        type.put("description", "");
        type.put("isActive", true);
        type.put("severity", determineSeverity(id));
        type.put("createdAt", FieldValue.serverTimestamp());
        return type;
    }

    /**
     * Helper pour créer un rôle
     */
    private Map<String, Object> createRole(String name, String description, List<String> permissions) {
        Map<String, Object> role = new HashMap<>();
        role.put("name", name);
        role.put("description", description);
        role.put("permissions", permissions);
        role.put("createdAt", FieldValue.serverTimestamp());
        return role;
    }

    /**
     * Déterminer le niveau de sévérité basé sur le type
     */
    private String determineSeverity(Long typeId) {
        return switch (typeId.intValue()) {
            case 1, 2, 9 -> "high";      // Nid de poule, Inondation, Circulation dangereuse
            case 3, 6, 7 -> "medium";    // Dégradation route, Obstruction, Canalisation
            default -> "low";             // Autres
        };
    }

    /**
     * Faire un dump de toutes les collections (utile pour debug)
     */
    public void dumpAllCollections() throws ExecutionException, InterruptedException {
        log.info("📊 Dump des collections Firebase:");

        String[] collections = {"signalementTypes", "roles", "users", "problemes", "signalements"};

        for (String collectionName : collections) {
            QuerySnapshot snapshot = firestore.collection(collectionName).get().get();
            log.info("Collection '{}': {} documents", collectionName, snapshot.size());
            
            for (DocumentSnapshot doc : snapshot.getDocuments()) {
                log.debug("  - {}: {}", doc.getId(), doc.getData());
            }
        }
    }
}
