package com.projet.Cloud.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Configuration pour activer le scheduling (synchronisation périodique)
 */
@Configuration
@EnableScheduling
public class SyncConfiguration {
    // Les tâches planifiées dans SyncService seront automatiquement exécutées
}