package com.projet.Cloud.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "signalements")
public class Signalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "firebase_id", unique = true)
    private String firebaseId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "type_id", nullable = false)
    private SignalementType type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_signalement")
    private LocalDateTime dateSignalement;

    @Column(nullable = false)
    private String status = "nouveau"; // nouveau, en_cours, terminé

    @Column(name = "surface_m2")
    private Double surfaceM2;

    @Column(columnDefinition = "DECIMAL(10,2)")
    private Double budget;

    // @Column(name = "entreprise_concernee")
    // private String entrepriseConcernee;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    public Signalement() {
        this.dateSignalement = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirebaseId() {
        return firebaseId;
    }

    public void setFirebaseId(String firebaseId) {
        this.firebaseId = firebaseId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public SignalementType getType() {
        return type;
    }

    public void setType(SignalementType type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getDateSignalement() {
        return dateSignalement;
    }

    public void setDateSignalement(LocalDateTime dateSignalement) {
        this.dateSignalement = dateSignalement;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getSurfaceM2() {
        return surfaceM2;
    }

    public void setSurfaceM2(Double surfaceM2) {
        this.surfaceM2 = surfaceM2;
    }

    public Double getBudget() {
        return budget;
    }

    public void setBudget(Double budget) {
        this.budget = budget;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
