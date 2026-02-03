package com.projet.Cloud.service;

import com.google.cloud.Timestamp;
import com.projet.Cloud.model.Probleme;
import com.projet.Cloud.model.Signalement;
import com.projet.Cloud.model.SignalementType;
import com.projet.Cloud.model.User;
import com.projet.Cloud.repository.ProblemeRepository;
import com.projet.Cloud.repository.SignalementRepository;
import com.projet.Cloud.repository.SignalementTypeRepository;
import com.projet.Cloud.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service de synchronisation entre Firebase et la base locale
 */
@Service
@Slf4j
public class SyncService {

    @PersistenceContext
    private EntityManager entityManager;

    private final FirebaseSignalementService firebaseSignalementService;
    private final FirebaseProblemeService firebaseProblemeService;
    private final SignalementRepository signalementRepository;
    private final SignalementTypeRepository signalementTypeRepository;
    private final ProblemeRepository problemeRepository;
    private final UserRepository userRepository;
    
    private boolean wasOffline = false;

    @Autowired
    public SyncService(FirebaseSignalementService firebaseSignalementService,
                      FirebaseProblemeService firebaseProblemeService,
                      SignalementRepository signalementRepository,
                      SignalementTypeRepository signalementTypeRepository,
                      ProblemeRepository problemeRepository,
                      UserRepository userRepository) {
        this.firebaseSignalementService = firebaseSignalementService;
        this.firebaseProblemeService = firebaseProblemeService;
        this.signalementRepository = signalementRepository;
        this.signalementTypeRepository = signalementTypeRepository;
        this.problemeRepository = problemeRepository;
        this.userRepository = userRepository;
    }

    /**
     * Vérifie périodiquement la connexion et synchronise si nécessaire
     * S'exécute toutes les 5 minutes
     */
    @Scheduled(fixedDelay = 300000, initialDelay = 60000)
    public void checkAndSync() {
        boolean isOnline = isInternetAvailable();
        
        if (isOnline && wasOffline) {
            log.info("Connexion internet rétablie - Démarrage de la synchronisation");
            syncPendingData();
            wasOffline = false;
        } else if (!isOnline) {
            log.debug("Mode offline détecté");
            wasOffline = true;
        }
    }

    /**
     * Synchronise les données en attente vers Firebase
     */
    private void syncPendingData() {
        try {
            log.info("Synchronisation des données en attente vers Firebase");
            syncSignalementTypesFromFirebase();
            syncSignalementsFromFirebase();
            syncProblemeFromFirebase();
        } catch (Exception e) {
            log.error("Erreur lors de la synchronisation: {}", e.getMessage(), e);
        }
    }

    /**
     * Synchronise les types de signalements depuis Firebase vers PostgreSQL
     * Firebase collection: signalementTypes -> PostgreSQL table: type
     */
    @Transactional
    protected void syncSignalementTypesFromFirebase() {
        try {
            log.info("🔄 Synchronisation des types depuis Firebase (signalementTypes) vers PostgreSQL (type)...");
            List<Map<String, Object>> firebaseTypes = firebaseSignalementService.getAllSignalementTypes();
            int syncedCount = 0;

            for (Map<String, Object> data : firebaseTypes) {
                Long typeId = extractLong(data.get("id"));
                if (typeId == null) {
                    log.warn("⚠️ Type sans ID ignoré");
                    continue;
                }

                String libelle = getAsString(data.get("libelle"));
                String iconColor = getAsString(data.get("iconColor"));
                String iconSymbol = getAsString(data.get("iconSymbol"));

                if (libelle == null || libelle.isBlank()) {
                    log.warn("⚠️ Type {} sans libellé ignoré", typeId);
                    continue;
                }

                // Utiliser une requête SQL native pour INSERT ou UPDATE avec ID spécifique
                // PostgreSQL: INSERT ... ON CONFLICT DO UPDATE
                int updated = entityManager.createNativeQuery(
                    "INSERT INTO type (id, libelle, icon_color, icon_symbol) " +
                    "VALUES (:id, :libelle, :iconColor, :iconSymbol) " +
                    "ON CONFLICT (id) DO UPDATE SET " +
                    "libelle = :libelle, " +
                    "icon_color = :iconColor, " +
                    "icon_symbol = :iconSymbol"
                )
                .setParameter("id", typeId)
                .setParameter("libelle", libelle)
                .setParameter("iconColor", iconColor)
                .setParameter("iconSymbol", iconSymbol)
                .executeUpdate();

                log.debug("✅ Type {} synchronisé: {}", typeId, libelle);
                syncedCount++;
            }

            // Mettre à jour la séquence pour les futurs inserts
            entityManager.createNativeQuery(
                "SELECT setval('type_id_seq', (SELECT MAX(id) FROM type))"
            ).getSingleResult();

            log.info("✅ Synchronisation types terminée: {} types synchronisés (Firebase → PostgreSQL)", syncedCount);
        } catch (Exception e) {
            log.error("❌ Erreur sync types Firebase (signalementTypes) -> Postgres (type): {}", e.getMessage(), e);
        }
    }

    @Transactional
    protected void syncSignalementsFromFirebase() {
        try {
            List<Map<String, Object>> firebaseSignalements = firebaseSignalementService.getAllSignalements();
            int syncedCount = 0;

            for (Map<String, Object> data : firebaseSignalements) {
                String firebaseId = getAsString(data.get("firebaseId"));
                if (firebaseId == null || firebaseId.isBlank()) {
                    continue;
                }

                Optional<Signalement> existingOpt = signalementRepository.findByFirebaseId(firebaseId);
                Signalement signalement = existingOpt.orElseGet(Signalement::new);
                signalement.setFirebaseId(firebaseId);

                Long userId = extractUserId(data.get("userId"));
                Long typeId = extractLong(data.get("typeId"));

                if (userId != null) {
                    userRepository.findById(userId).ifPresent(signalement::setUser);
                }

                if (typeId != null) {
                    signalementTypeRepository.findById(typeId).ifPresent(signalement::setType);
                }

                if (signalement.getUser() == null || signalement.getType() == null) {
                    continue;
                }

                signalement.setLatitude(extractDouble(data.get("latitude")));
                signalement.setLongitude(extractDouble(data.get("longitude")));
                signalement.setDescription(getAsString(data.get("description")));
                signalement.setSurfaceM2(extractDouble(data.get("surfaceM2")));
                signalement.setBudget(extractDouble(data.get("budget")));
                signalement.setStatus(getAsString(data.get("status")) != null ? getAsString(data.get("status")) : "nouveau");

                LocalDateTime createdAt = toLocalDateTime(data.get("createdAt"));
                if (createdAt != null) {
                    signalement.setCreatedAt(createdAt);
                }

                LocalDateTime dateSignalement = toLocalDateTime(data.get("dateSignalement"));
                if (dateSignalement != null) {
                    signalement.setDateSignalement(dateSignalement);
                }

                LocalDateTime updatedAt = toLocalDateTime(data.get("updatedAt"));
                if (updatedAt != null) {
                    signalement.setUpdatedAt(updatedAt);
                }

                signalementRepository.save(signalement);
                syncedCount++;
            }

            log.info("Synchronisation signalements terminée: {} enregistrements", syncedCount);
        } catch (Exception e) {
            log.error("Erreur sync signalements Firebase -> Postgres: {}", e.getMessage(), e);
        }
    }

    @Transactional
    protected void syncProblemeFromFirebase() {
        try {
            List<Map<String, Object>> firebaseProblemes = firebaseProblemeService.getAllProblemes();
            int syncedCount = 0;

            for (Map<String, Object> data : firebaseProblemes) {
                String firebaseId = getAsString(data.get("firebaseId"));
                if (firebaseId == null || firebaseId.isBlank()) {
                    continue;
                }

                // Ignorer les documents exemple
                if (Boolean.TRUE.equals(data.get("_isExample"))) {
                    continue;
                }

                Optional<Probleme> existingOpt = problemeRepository.findByFirebaseId(firebaseId);
                Probleme probleme = existingOpt.orElseGet(Probleme::new);
                probleme.setFirebaseId(firebaseId);

                Long userId = extractUserId(data.get("userId"));
                if (userId == null) {
                    log.warn("⚠️ Problème {} sans userId valide", firebaseId);
                    continue;
                }

                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isEmpty()) {
                    log.warn("⚠️ Utilisateur {} introuvable", userId);
                    continue;
                }

                probleme.setUser(userOpt.get());

                // Type est optionnel
                Long typeId = extractLong(data.get("typeId"));
                if (typeId != null) {
                    signalementTypeRepository.findById(typeId).ifPresent(probleme::setType);
                }

                probleme.setLatitude(extractDouble(data.get("latitude")));
                probleme.setLongitude(extractDouble(data.get("longitude")));
                probleme.setDescription(getAsString(data.get("description")));
                probleme.setStatus(getAsString(data.get("status")) != null ? getAsString(data.get("status")) : "ouvert");

                LocalDateTime createdAt = toLocalDateTime(data.get("createdAt"));
                if (createdAt != null) {
                    probleme.setCreatedAt(createdAt);
                }

                LocalDateTime updatedAt = toLocalDateTime(data.get("updatedAt"));
                if (updatedAt != null) {
                    probleme.setUpdatedAt(updatedAt);
                }

                problemeRepository.save(probleme);
                syncedCount++;
            }

            log.info("✅ Synchronisation problèmes terminée: {} enregistrements synced", syncedCount);
        } catch (Exception e) {
            log.error("❌ Erreur sync problèmes Firebase -> Postgres: {}", e.getMessage(), e);
        }
    }

    private Long extractUserId(Object userObj) {
        if (userObj == null) return null;
        if (userObj instanceof Number) return ((Number) userObj).longValue();
        if (userObj instanceof String) return parseLongSafe((String) userObj);
        if (userObj instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) userObj;
            Object id = map.get("id");
            if (id == null) id = map.get("userId");
            if (id instanceof Number) return ((Number) id).longValue();
            if (id instanceof String) return parseLongSafe((String) id);
            Object email = map.get("email");
            if (email instanceof String) {
                return userRepository.findByEmail((String) email)
                        .map(User::getId)
                        .orElse(null);
            }
        }
        return null;
    }

    private Long extractLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();
        if (value instanceof String) return parseLongSafe((String) value);
        return null;
    }

    private Double extractDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).doubleValue();
        if (value instanceof String) {
            try {
                return Double.parseDouble((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private String getAsString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Long parseLongSafe(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDateTime toLocalDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof Timestamp) {
            Timestamp ts = (Timestamp) value;
            return LocalDateTime.ofInstant(ts.toDate().toInstant(), ZoneId.systemDefault());
        }
        if (value instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) value;
            Object secondsObj = map.get("seconds");
            Object nanosObj = map.get("nanoseconds");
            if (secondsObj instanceof Number) {
                long seconds = ((Number) secondsObj).longValue();
                long nanos = nanosObj instanceof Number ? ((Number) nanosObj).longValue() : 0L;
                return LocalDateTime.ofInstant(Instant.ofEpochSecond(seconds, nanos), ZoneId.systemDefault());
            }
        }
        if (value instanceof String) {
            try {
                return LocalDateTime.parse((String) value);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Vérifie la disponibilité d'internet
     */
    private boolean isInternetAvailable() {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("www.google.com", 443), 3000);
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Force la synchronisation manuelle
     */
    public void forceSyncNow() {
        if (isInternetAvailable()) {
            log.info("Synchronisation forcée démarrée");
            syncPendingData();
        } else {
            log.warn("Impossible de synchroniser - Pas de connexion internet");
        }
    }
}