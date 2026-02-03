package com.projet.Cloud.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateProblemeRequest {

    @NotNull(message = "La latitude est requise")
    private Double latitude;

    @NotNull(message = "La longitude est requise")
    private Double longitude;

    /**
     * Optionnel côté mobile : le manager peut affecter le type lors de la conversion.
     */
    private Long typeId;

    @NotBlank(message = "La description est requise")
    private String description;
}
