package com.projet.Cloud.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConvertProblemeRequest {

    @NotNull(message = "Le type est requis pour la conversion")
    private Long typeId;

    private Double surfaceM2;

    private Double budget;

    private Integer niveau;

    /**
     * Permet au manager d'ajouter ou préciser la description lors de la conversion.
     */
    @NotBlank(message = "La description est requise pour le signalement")
    private String description;
}
