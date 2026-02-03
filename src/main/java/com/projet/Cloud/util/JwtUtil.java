package com.projet.Cloud.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import jakarta.annotation.PostConstruct;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

public class JwtUtil {

    // Clé secrète par défaut (peut être remplacée via init)
    private static Key key;

    // Durée par défaut du token en ms (1h)
    private static long defaultExpirationMs = 3600000;

    /**
     * Initialise la clé secrète pour signer les tokens.
     * Peut être appelée au démarrage ou via configuration.
     * @param secret chaîne secrète
     */
    @PostConstruct
    public static void init(String secret) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(secret);
            key = Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException e) {
            // Pas du Base64 ? On prend la version brute UTF-8
            key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        }
    }


    /** Génère un token avec expiration personnalisée */
    public static String generateToken(Map<String, Object> claims, long expirationMs) {
        long now = System.currentTimeMillis();
        if (key == null) init(null); // fallback si jamais non initialisé
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationMs))
                .signWith(key)
                .compact();
    }

    /** Génère un token avec expiration par défaut */
    public static String generateToken(Map<String, Object> claims) {
        return generateToken(claims, defaultExpirationMs);
    }

    /** Retourne la clé utilisée pour signer */
    public static Key getKey() {
        if (key == null) init(null);
        return key;
    }
}
