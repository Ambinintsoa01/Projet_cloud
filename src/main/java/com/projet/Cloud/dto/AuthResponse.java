package com.projet.Cloud.dto;

import java.util.Set;

public class AuthResponse {
    private String token;
    private Long expiresAt;
    private Long userId;
    private String email;
    private String username;
    private Set<String> roles;

    public AuthResponse() {}
    
    public AuthResponse(String token, Long expiresAt) {
        this.token = token;
        this.expiresAt = expiresAt;
    }

    public AuthResponse(String token, Long expiresAt, Long userId, String email, String username, Set<String> roles) {
        this.token = token;
        this.expiresAt = expiresAt;
        this.userId = userId;
        this.email = email;
        this.username = username;
        this.roles = roles;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public Long getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Long expiresAt) { this.expiresAt = expiresAt; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }
}
