package com.projet.Cloud.controller;

import com.projet.Cloud.dto.SignalementTypeDto;
import com.projet.Cloud.model.SignalementType;
import com.projet.Cloud.repository.SignalementTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/signalement-types")
@RequiredArgsConstructor
@Slf4j
public class SignalementTypeController {

    private final SignalementTypeRepository typeRepository;

    /**
     * Récupérer tous les types de signalements
     */
    @GetMapping
    public ResponseEntity<List<SignalementTypeDto>> getAllTypes() {
        log.info("Récupération de tous les types de signalements");
        List<SignalementTypeDto> types = typeRepository.findAll()
                .stream()
                .map(SignalementTypeDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }

    /**
     * Récupérer un type de signalement par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<SignalementTypeDto> getTypeById(@PathVariable Long id) {
        log.info("Récupération du type de signalement: {}", id);
        return typeRepository.findById(id)
                .map(type -> ResponseEntity.ok(SignalementTypeDto.fromEntity(type)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Récupérer un type par libellé
     */
    @GetMapping("/search/libelle")
    public ResponseEntity<SignalementTypeDto> getTypeByLibelle(@RequestParam String libelle) {
        log.info("Récupération du type par libellé: {}", libelle);
        return typeRepository.findByLibelle(libelle)
                .map(type -> ResponseEntity.ok(SignalementTypeDto.fromEntity(type)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Créer un nouveau type de signalement (ADMIN uniquement)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SignalementTypeDto> createType(
            @RequestBody SignalementTypeDto dto) {
        log.info("Création d'un nouveau type de signalement: {}", dto.getLibelle());
        
        SignalementType type = new SignalementType();
        type.setLibelle(dto.getLibelle());
        type.setIconColor(dto.getIconColor());
        type.setIconSymbol(dto.getIconSymbol());
        
        SignalementType saved = typeRepository.save(type);
        return ResponseEntity.status(201).body(SignalementTypeDto.fromEntity(saved));
    }

    /**
     * Mettre à jour un type de signalement (ADMIN uniquement)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SignalementTypeDto> updateType(
            @PathVariable Long id,
            @RequestBody SignalementTypeDto dto) {
        log.info("Mise à jour du type de signalement: {}", id);
        
        return typeRepository.findById(id)
                .map(type -> {
                    if (dto.getLibelle() != null) {
                        type.setLibelle(dto.getLibelle());
                    }
                    if (dto.getIconColor() != null) {
                        type.setIconColor(dto.getIconColor());
                    }
                    if (dto.getIconSymbol() != null) {
                        type.setIconSymbol(dto.getIconSymbol());
                    }
                    
                    SignalementType updated = typeRepository.save(type);
                    return ResponseEntity.ok(SignalementTypeDto.fromEntity(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Supprimer un type de signalement (ADMIN uniquement)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteType(@PathVariable Long id) {
        log.info("Suppression du type de signalement: {}", id);
        
        if (typeRepository.existsById(id)) {
            typeRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
