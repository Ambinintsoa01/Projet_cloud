package com.projet.Cloud;


import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;

import java.io.FileInputStream;

public class TestFirebaseToken {
    public static void main(String[] args) throws Exception {
        FileInputStream serviceAccount = new FileInputStream("firebase-credentials.json");

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(com.google.auth.oauth2.GoogleCredentials.fromStream(serviceAccount))
                .build();

        FirebaseApp app = FirebaseApp.initializeApp(options);

        UserRecord user = FirebaseAuth.getInstance(app).getUserByEmail("mirija7@gmail.com");
        String customToken = FirebaseAuth.getInstance(app).createCustomToken(user.getUid());

        System.out.println("Custom token: " + customToken);
    }
}

