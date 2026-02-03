package com.projet.Cloud.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<Map<String, Object>> handleAccountLocked(AccountLockedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Compte bloqué temporairement");
        body.put("message", ex.getMessage());
        body.put("username", ex.getUsername());
        body.put("until", ex.getUntil());
        body.put("status", 423); // HTTP 423 Locked
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(423).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAll(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Internal Server Error");
        body.put("message", ex.getMessage());
        body.put("status", 500);
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(500).body(body);
    }
}
