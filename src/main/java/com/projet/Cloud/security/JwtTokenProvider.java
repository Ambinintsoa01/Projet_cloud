package com.projet.Cloud.security;

import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    public String generateToken(String username) {
        // Placeholder, integrate JWT library
        return "token-for-" + username;
    }

    public boolean validateToken(String token) {
        // Placeholder validation
        return token != null && token.startsWith("token-for-");
    }

    public String getUsernameFromToken(String token) {
        if (token == null) return null;
        return token.replace("token-for-", "");
    }
}
