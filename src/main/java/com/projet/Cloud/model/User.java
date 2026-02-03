package com.projet.Cloud.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import com.projet.Cloud.repository.RoleRepository;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;

    // 🔹 Firebase UID
    private String firebaseUid;

    private LocalDateTime createdAt;

    // 🔹 Relation ManyToMany avec les rôles
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    public User() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFirebaseUid() { return firebaseUid; }
    public void setFirebaseUid(String firebaseUid) { this.firebaseUid = firebaseUid; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Set<Role> getRoles() { return roles; }

    // 🔹 Nouvelle méthode pour assigner depuis un tableau de String
    public void setRolesFromStrings(String[] roleNames, RoleRepository roleRepo) {
        Set<Role> roleSet = new HashSet<>();
        for (String name : roleNames) {
            Role role = roleRepo.findByName(name)
                                .orElseThrow(() -> new RuntimeException("Role introuvable: " + name));
            roleSet.add(role);
        }
        this.roles = roleSet;
    }

    // Méthode classique si tu veux setter directement un Set<Role>
    public void setRoles(Set<Role> roles) { this.roles = roles; }
}
