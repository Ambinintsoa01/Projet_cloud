package com.projet.Cloud.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProblemeWithUserDTO {
    private String id;
    private Long userId;
    private Double latitude;
    private Double longitude;
    private String description;
    private String typeId;
    private String status;
    private Object createdAt;  // Object pour gérer les timestamps Firestore
    private Object updatedAt;  // Object pour gérer les timestamps Firestore
    
    // Informations utilisateur enrichies
    private UserInfo user;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserInfo {
        private Long id;
        private String email;
        private String fullName;
        private String username;
    }
}
