package com.projet.Cloud.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "problemes")
public class Probleme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "type_id")
    private SignalementType type; // Optionnel, le manager peut l'affecter lors de la conversion

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private String status = "ouvert"; // ouvert, converti, rejete

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "converted_at")
    private LocalDateTime convertedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "converted_by")
    private User convertedBy; // manager qui a converti en signalement

    @Column(name = "firebase_id", unique = true)
    private String firebaseId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public SignalementType getType() {
        return type;
    }

    public void setType(SignalementType type) {
        this.type = type;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public LocalDateTime getConvertedAt() {
        return convertedAt;
    }

    public void setConvertedAt(LocalDateTime convertedAt) {
        this.convertedAt = convertedAt;
    }

    public User getConvertedBy() {
        return convertedBy;
    }

    public void setConvertedBy(User convertedBy) {
        this.convertedBy = convertedBy;
    }

    public String getFirebaseId() {
        return firebaseId;
    }

    public void setFirebaseId(String firebaseId) {
        this.firebaseId = firebaseId;
    }
}
