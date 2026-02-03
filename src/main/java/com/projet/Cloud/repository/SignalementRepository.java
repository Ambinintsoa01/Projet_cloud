package com.projet.Cloud.repository;

import com.projet.Cloud.model.Signalement;
import com.projet.Cloud.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {

    java.util.Optional<Signalement> findByFirebaseId(String firebaseId);
    
    // Récupérer tous les signalements d'un utilisateur
    List<Signalement> findByUser(User user);
    
    // Récupérer les signalements par statut
    List<Signalement> findByStatus(String status);
    
    // Récupérer les signalements par type
    List<Signalement> findByTypeId(Long typeId);
    
    // Récupérer les signalements créés entre deux dates
    @Query("SELECT s FROM Signalement s WHERE s.createdAt BETWEEN :startDate AND :endDate")
    List<Signalement> findByDateRange(@Param("startDate") LocalDateTime startDate, 
                                      @Param("endDate") LocalDateTime endDate);
    
    // Récupérer les signalements dans une zone géographique (approximatif)
    @Query("SELECT s FROM Signalement s WHERE " +
           "s.latitude BETWEEN :minLat AND :maxLat AND " +
           "s.longitude BETWEEN :minLon AND :maxLon")
    List<Signalement> findByGeographicZone(@Param("minLat") Double minLat,
                                           @Param("maxLat") Double maxLat,
                                           @Param("minLon") Double minLon,
                                           @Param("maxLon") Double maxLon);
    
    // Récupérer les signalements non résolus
    @Query("SELECT s FROM Signalement s WHERE s.status != 'terminé'")
    List<Signalement> findUnresolvedSignalements();
    
    // Compter les signalements par statut
    long countByStatus(String status);
}
