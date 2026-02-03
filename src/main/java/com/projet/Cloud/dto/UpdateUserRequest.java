

package com.projet.Cloud.dto;

public class UpdateUserRequest {
    private String username;
    private String email;
    private String password; // facultatif si tu veux permettre la modification

    // Getters et setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
