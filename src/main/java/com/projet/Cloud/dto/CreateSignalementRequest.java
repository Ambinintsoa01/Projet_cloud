package com.projet.Cloud.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSignalementRequest {
    
    @NotNull(message = "La latitude est requise")
    private Double latitude;
    
    @NotNull(message = "La longitude est requise")
    private Double longitude;
    
    @NotNull(message = "Le type est requis")
    private Long typeId;
    
    @NotBlank(message = "La description est requise")
    private String description;
    
    private Double surfaceM2;
    
    private Double budget;
    
}
