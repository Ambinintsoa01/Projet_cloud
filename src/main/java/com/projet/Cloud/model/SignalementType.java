package com.projet.Cloud.model;

import jakarta.persistence.*;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "type")
public class SignalementType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String libelle; // Ex: "Nid de poule", "Fissure", "Pothole", etc.

    @Column(name = "icon_color")
    private String iconColor; // Ex: "red", "yellow", "green", "blue", "orange", "purple", "red-white"

    @Column(name = "icon_symbol")
    private String iconSymbol; // Ex: "!", "check", "wrench", "water", "car", "checkered"

    @OneToMany(mappedBy = "type", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Signalement> signalements;

    public SignalementType() {}

    public SignalementType(String libelle, String iconColor, String iconSymbol) {
        this.libelle = libelle;
        this.iconColor = iconColor;
        this.iconSymbol = iconSymbol;
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLibelle() {
        return libelle;
    }

    public void setLibelle(String libelle) {
        this.libelle = libelle;
    }

    public String getIconColor() {
        return iconColor;
    }

    public void setIconColor(String iconColor) {
        this.iconColor = iconColor;
    }

    public String getIconSymbol() {
        return iconSymbol;
    }

    public void setIconSymbol(String iconSymbol) {
        this.iconSymbol = iconSymbol;
    }

    public Set<Signalement> getSignalements() {
        return signalements;
    }

    public void setSignalements(Set<Signalement> signalements) {
        this.signalements = signalements;
    }
}
