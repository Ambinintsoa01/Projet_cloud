package com.projet.Cloud.service;

import com.google.cloud.firestore.Firestore;
import com.projet.Cloud.dto.CreateSignalementRequest;
import com.projet.Cloud.model.SignalementType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("FirebaseSignalementService Tests")
public class FirebaseSignalementServiceTest {

    @Autowired
    private FirebaseSignalementService firebaseService;

    @Autowired
    private Firestore firestore;

    private CreateSignalementRequest testRequest;
    private SignalementType testType;

    @BeforeEach
    public void setUp() {
        testRequest = new CreateSignalementRequest();
        testRequest.setLatitude(48.8566);
        testRequest.setLongitude(2.3522);
        testRequest.setTypeId(1L);
        testRequest.setDescription("Test signalement");
        testRequest.setSurfaceM2(2.5);
        testRequest.setBudget(500.0);

        testType = new SignalementType();
        testType.setId(1L);
        testType.setLibelle("Nid de poule");
        testType.setIconColor("#FF4444");
        testType.setIconSymbol("⚠️");
    }

    @Test
    @DisplayName("Test: Créer un signalement dans Firestore")
    public void testCreateSignalement() throws ExecutionException, InterruptedException {
        String docId = firebaseService.createSignalement(testRequest, 1L, testType);

        assertNotNull(docId);
        assertFalse(docId.isEmpty());

        // Vérifier que le document a été créé
        Map<String, Object> signalement = firebaseService.getSignalementById(docId);
        assertNotNull(signalement);
        assertEquals(48.8566, signalement.get("latitude"));
        assertEquals(2.3522, signalement.get("longitude"));
    }

    @Test
    @DisplayName("Test: Récupérer tous les signalements")
    public void testGetAllSignalements() throws ExecutionException, InterruptedException {
        List<Map<String, Object>> signalements = firebaseService.getAllSignalements();

        assertNotNull(signalements);
        assertTrue(signalements.size() >= 0);
    }

    @Test
    @DisplayName("Test: Récupérer signalements par utilisateur")
    public void testGetSignalementsByUser() throws ExecutionException, InterruptedException {
        Long userId = 1L;
        List<Map<String, Object>> signalements = firebaseService.getSignalementsByUser(userId);

        assertNotNull(signalements);
        for (Map<String, Object> sig : signalements) {
            assertEquals(userId.toString(), sig.get("userId"));
        }
    }

    @Test
    @DisplayName("Test: Récupérer signalements par statut")
    public void testGetSignalementsByStatus() throws ExecutionException, InterruptedException {
        String status = "nouveau";
        List<Map<String, Object>> signalements = firebaseService.getSignalementsByStatus(status);

        assertNotNull(signalements);
        for (Map<String, Object> sig : signalements) {
            assertEquals(status, sig.get("status"));
        }
    }

    @Test
    @DisplayName("Test: Récupérer signalements par zone géographique")
    public void testGetSignalementsByZone() throws ExecutionException, InterruptedException {
        List<Map<String, Object>> signalements = firebaseService.getSignalementsByZone(
                48.8, 48.9,
                2.2, 2.4
        );

        assertNotNull(signalements);
        for (Map<String, Object> sig : signalements) {
            Double lat = (Double) sig.get("latitude");
            Double lon = (Double) sig.get("longitude");
            assertTrue(lat >= 48.8 && lat <= 48.9);
            assertTrue(lon >= 2.2 && lon <= 2.4);
        }
    }

    @Test
    @DisplayName("Test: Récupérer tous les types de signalements")
    public void testGetAllSignalementTypes() throws ExecutionException, InterruptedException {
        List<Map<String, Object>> types = firebaseService.getAllSignalementTypes();

        assertNotNull(types);
        assertTrue(types.size() >= 0);
        
        // Vérifier que les types ont les champs obligatoires
        for (Map<String, Object> type : types) {
            assertNotNull(type.get("libelle"));
            assertNotNull(type.get("iconColor"));
            assertNotNull(type.get("iconSymbol"));
        }
    }

    @Test
    @DisplayName("Test: Ajouter un commentaire")
    public void testAddComment() throws ExecutionException, InterruptedException {
        // Créer d'abord un signalement
        String docId = firebaseService.createSignalement(testRequest, 1L, testType);

        // Ajouter un commentaire
        assertDoesNotThrow(() -> {
            firebaseService.addCommentToSignalement(docId, 2L, "Très urgent!");
        });
    }

    @Test
    @DisplayName("Test: Ajouter une pièce jointe")
    public void testAddAttachment() throws ExecutionException, InterruptedException {
        // Créer d'abord un signalement
        String docId = firebaseService.createSignalement(testRequest, 1L, testType);

        // Ajouter une pièce jointe
        assertDoesNotThrow(() -> {
            firebaseService.addAttachmentToSignalement(
                    docId,
                    "gs://bucket/photo.jpg",
                    "image"
            );
        });
    }

    @Test
    @DisplayName("Test: Créer/Mettre à jour un type de signalement")
    public void testCreateOrUpdateSignalementType() throws ExecutionException, InterruptedException {
        String typeId = firebaseService.createOrUpdateSignalementType(1L, testType);

        assertNotNull(typeId);
        assertFalse(typeId.isEmpty());
    }

    @Test
    @DisplayName("Test: Créer/Mettre à jour un utilisateur")
    public void testCreateOrUpdateUser() throws ExecutionException, InterruptedException {
        // À adapter selon votre implémentation
        // String userId = firebaseService.createOrUpdateUser(1L, testUser);
        // assertNotNull(userId);
    }

    @Test
    @DisplayName("Test: Vérifier que Firestore est connecté")
    public void testFirestoreConnection() {
        assertNotNull(firestore);
    }

    @Test
    @DisplayName("Test: Enregistrer une tentative de connexion")
    public void testLogLoginAttempt() throws ExecutionException, InterruptedException {
        assertDoesNotThrow(() -> {
            firebaseService.logLoginAttempt(
                    "test@example.com",
                    true,
                    "192.168.1.1",
                    "Mozilla/5.0..."
            );
        });
    }

    @Test
    @DisplayName("Test: Créer une session")
    public void testCreateSession() throws ExecutionException, InterruptedException {
        String sessionId = firebaseService.createSession(
                1L,
                "fake-token",
                "fake-refresh-token",
                "192.168.1.1"
        );

        assertNotNull(sessionId);
        assertFalse(sessionId.isEmpty());
    }
}
