package com.projet.Cloud.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSignalementRequest {
    
    private String description;
    
    @Pattern(regexp = "nouveau|en_cours|terminé", message = "Le statut doit être: nouveau, en_cours ou terminé")
    private String status;
    
    private Double surfaceM2;
    
    private Double budget;
    
    private String entrepriseConcernee;
}
