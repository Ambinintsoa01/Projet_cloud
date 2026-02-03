package com.projet.Cloud.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité pour suivre les opérations en attente de synchronisation avec Firebase
 */
@Entity
@Table(name = "pending_sync")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PendingSync {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SyncOperation operation;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;  // JSON des données à synchroniser

    @Column(nullable = false)
    private String entityType;  // "USER", "AUTH", etc.

    @Column(name = "entity_id")
    private Long entityId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime syncedAt;

    @Column
    private Integer retryCount = 0;

    @Column
    private String errorMessage;

    @Column(nullable = false)
    private Boolean synced = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum SyncOperation {
        CREATE,
        UPDATE,
        DELETE,
        AUTHENTICATE,
        REGISTER
    }
}