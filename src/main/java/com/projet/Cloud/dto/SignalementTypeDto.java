package com.projet.Cloud.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignalementTypeDto {
    private Long id;
    private String libelle;
    private String iconColor;
    private String iconSymbol;

    // Mapper depuis l'entité
    public static SignalementTypeDto fromEntity(com.projet.Cloud.model.SignalementType type) {
        return new SignalementTypeDto(
            type.getId(),
            type.getLibelle(),
            type.getIconColor(),
            type.getIconSymbol()
        );
    }
}
