package com.projet.Cloud.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/status")
@Slf4j
public class StatusController {

    @GetMapping("/connection")
    public ResponseEntity<Map<String, Object>> checkConnection() {
        Map<String, Object> status = new HashMap<>();
        
        boolean isOnline = isInternetAvailable();
        status.put("online", isOnline);
        status.put("authMode", isOnline ? "Firebase" : "Local PostgreSQL");
        status.put("timestamp", System.currentTimeMillis());
        
        log.info("Statut de connexion: {}", isOnline ? "ONLINE" : "OFFLINE");
        
        return ResponseEntity.ok(status);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Identity Provider");
        return ResponseEntity.ok(health);
    }

    private boolean isInternetAvailable() {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("www.google.com", 443), 3000);
            return true;
        } catch (IOException e) {
            return false;
        }
    }
}