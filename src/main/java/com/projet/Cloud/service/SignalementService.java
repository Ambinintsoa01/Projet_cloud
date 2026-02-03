package com.projet.Cloud.service;

import com.projet.Cloud.dto.CreateSignalementRequest;
import com.projet.Cloud.dto.UpdateSignalementRequest;
import com.projet.Cloud.model.Signalement;
import com.projet.Cloud.model.SignalementType;
import com.projet.Cloud.model.User;
import com.projet.Cloud.repository.SignalementRepository;
import com.projet.Cloud.repository.SignalementTypeRepository;
import com.projet.Cloud.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SignalementService {

    private final SignalementRepository signalementRepository;
    private final SignalementTypeRepository typeRepository;
    private final UserRepository userRepository;
    private final FirebaseSignalementService firebaseSignalementService;

    /**
     * Créer un nouveau signalement
     */
    public Signalement createSignalement(CreateSignalementRequest request, Long userId) {
        log.info("Création d'un nouveau signalement pour l'utilisateur: {}", userId);
        
        // Récupérer l'utilisateur
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        
        // Récupérer le type
        SignalementType type = typeRepository.findById(request.getTypeId())
                .orElseThrow(() -> new RuntimeException("Type de signalement introuvable"));
        
        // Créer le signalement
        Signalement signalement = new Signalement();
        signalement.setUser(user);
        signalement.setLatitude(request.getLatitude());
        signalement.setLongitude(request.getLongitude());
        signalement.setType(type);
        signalement.setDescription(request.getDescription());
        signalement.setSurfaceM2(request.getSurfaceM2());
        signalement.setBudget(request.getBudget());
        // signalement.setEntrepriseConcernee(request.getEntrepriseConcernee());
        signalement.setStatus("nouveau");
        signalement.setDateSignalement(LocalDateTime.now());
        
        return signalementRepository.save(signalement);
    }

    /**
     * Récupérer un signalement par ID
     */
    public Optional<Signalement> getSignalementById(Long id) {
        return signalementRepository.findById(id);
    }

    /**
     * Récupérer tous les signalements
     */
    public List<Signalement> getAllSignalements() {
        return signalementRepository.findAll();
    }

    /**
     * Récupérer les signalements d'un utilisateur
     */
    public List<Signalement> getSignalementsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return signalementRepository.findByUser(user);
    }

    /**
     * Récupérer les signalements par statut
     */
    public List<Signalement> getSignalementsByStatus(String status) {
        return signalementRepository.findByStatus(status);
    }

    /**
     * Récupérer les signalements par type
     */
    public List<Signalement> getSignalementsByType(Long typeId) {
        return signalementRepository.findByTypeId(typeId);
    }

    /**
     * Récupérer les signalements dans une zone géographique
     */
    public List<Signalement> getSignalementsByZone(Double minLat, Double maxLat, 
                                                    Double minLon, Double maxLon) {
        return signalementRepository.findByGeographicZone(minLat, maxLat, minLon, maxLon);
    }

    /**
     * Récupérer les signalements non résolus
     */
    public List<Signalement> getUnresolvedSignalements() {
        return signalementRepository.findUnresolvedSignalements();
    }

    /**
     * Mettre à jour un signalement
     */
    public Signalement updateSignalement(Long id, UpdateSignalementRequest request) {
        log.info("Mise à jour du signalement: {}", id);
        
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement introuvable"));
        
        if (request.getDescription() != null) {
            signalement.setDescription(request.getDescription());
        }
        
        if (request.getStatus() != null) {
            signalement.setStatus(request.getStatus());
        }
        
        if (request.getSurfaceM2() != null) {
            signalement.setSurfaceM2(request.getSurfaceM2());
        }
        
        if (request.getBudget() != null) {
            signalement.setBudget(request.getBudget());
        }
        
        // if (request.getEntrepriseConcernee() != null) {
        //     signalement.setEntrepriseConcernee(request.getEntrepriseConcernee());
        // }
        
        signalement.setUpdatedAt(LocalDateTime.now());
        
        Signalement saved = signalementRepository.save(signalement);

        // Synchroniser vers Firebase si firebaseId est disponible
        if (saved.getFirebaseId() != null && !saved.getFirebaseId().isBlank()) {
            try {
                firebaseSignalementService.updateSignalement(saved.getFirebaseId(), request);
                log.info("✅ Firebase sync OK pour signalement id={} firebaseId={}", saved.getId(), saved.getFirebaseId());
            } catch (Exception e) {
                log.warn("⚠️ Firebase sync échoué pour signalement id={} firebaseId={}: {}", saved.getId(), saved.getFirebaseId(), e.getMessage(), e);
            }
        } else {
            // Aucun firebaseId: créer l'entrée Firebase puis mettre à jour
            try {
                CreateSignalementRequest createRequest = new CreateSignalementRequest();
                createRequest.setLatitude(saved.getLatitude());
                createRequest.setLongitude(saved.getLongitude());
                createRequest.setTypeId(saved.getType().getId());
                createRequest.setDescription(saved.getDescription());
                createRequest.setSurfaceM2(saved.getSurfaceM2());
                createRequest.setBudget(saved.getBudget());

                String firebaseId = firebaseSignalementService.createSignalement(
                        createRequest,
                        saved.getUser().getId(),
                        saved.getType()
                );

                saved.setFirebaseId(firebaseId);
                signalementRepository.save(saved);

                // Appliquer les champs mis à jour (statut, etc.)
                firebaseSignalementService.updateSignalement(firebaseId, request);
                log.info("✅ Firebase sync (create+update) OK pour signalement id={} firebaseId={}", saved.getId(), firebaseId);
            } catch (Exception e) {
                log.warn("⚠️ Firebase create/sync échoué pour signalement id={}: {}", saved.getId(), e.getMessage(), e);
            }
        }
        
        return saved;
    }

    /**
     * Supprimer un signalement
     */
    public void deleteSignalement(Long id) {
        log.info("Suppression du signalement: {}", id);
        signalementRepository.deleteById(id);
    }

    /**
     * Récupérer les statistiques des signalements
     */
    public SignalementStats getStats() {
        return SignalementStats.builder()
                .totalSignalements(signalementRepository.count())
                .nouveaux(signalementRepository.countByStatus("nouveau"))
                .enCours(signalementRepository.countByStatus("en_cours"))
                .termines(signalementRepository.countByStatus("terminé"))
                .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class SignalementStats {
        private long totalSignalements;
        private long nouveaux;
        private long enCours;
        private long termines;
    }
}
