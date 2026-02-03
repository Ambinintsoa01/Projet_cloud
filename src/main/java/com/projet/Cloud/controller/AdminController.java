package com.projet.Cloud.controller;

import com.projet.Cloud.service.FirestoreInitializationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final FirestoreInitializationService firestoreInitializationService;

    /**
     * Initialise manuellement les collections Firestore
     * Accessible publiquement pour faciliter l'initialisation
     * 
     * POST /api/init-firestore
     */
    @PostMapping("/init-firestore")
    public ResponseEntity<Map<String, Object>> initializeFirestore() {
        log.info("🔧 Initialisation manuelle des collections Firestore");
        
        Map<String, Object> result = firestoreInitializationService.manualInitialization();
        
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.internalServerError().body(result);
        }
    }

    /**
     * Version admin protégée
     */
    @PostMapping("/admin/init-firestore")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> adminInitializeFirestore() {
        return initializeFirestore();
    }
}
