package com.projet.Cloud.config;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;

import jakarta.annotation.PostConstruct;

@Configuration
public class FirebaseConfig {

    @Value("${FIREBASE_CREDENTIALS_PATH}")
    private String firebaseConfigPath;

    @PostConstruct
    public void init() throws IOException {
        try (InputStream serviceAccount = new FileInputStream(firebaseConfigPath)) {
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
        } catch (Exception e) {
            throw new RuntimeException("Impossible d'initialiser Firebase. Vérifie le fichier de credentials.", e);
        }
    }

    /**
     * Expose Firestore so Spring can inject it wherever needed.
     */
    @Bean
    public Firestore firestore() {
        return FirestoreClient.getFirestore();
    }
}

