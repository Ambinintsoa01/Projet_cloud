package com.projet.Cloud.controller;

import com.projet.Cloud.dto.ConvertProblemeRequest;
import com.projet.Cloud.dto.CreateProblemeRequest;
import com.projet.Cloud.model.Probleme;
import com.projet.Cloud.model.Signalement;
import com.projet.Cloud.model.User;
import com.projet.Cloud.repository.UserRepository;
import com.projet.Cloud.service.ProblemeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/problemes")
@RequiredArgsConstructor
@Slf4j
public class ProblemeController {

    private final ProblemeService problemeService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Probleme> creerProbleme(@Valid @RequestBody CreateProblemeRequest request,
                                                  Authentication authentication) {
        Long userId = extractUserId(authentication);
        Probleme saved = problemeService.createProbleme(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<Probleme>> listerProblemes() {
        return ResponseEntity.ok(problemeService.listProblemes());
    }

    @GetMapping("/ouverts")
    public ResponseEntity<List<Probleme>> listerProblemesOuverts() {
        return ResponseEntity.ok(problemeService.listProblemesOuverts());
    }

    @GetMapping("/user/me")
    @PreAuthorize("hasRole('USER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Probleme>> mesProblemes(Authentication authentication) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(problemeService.listProblemesByUser(userId));
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Signalement> convertirProbleme(@PathVariable Long id,
                                                         @Valid @RequestBody ConvertProblemeRequest request,
                                                         Authentication authentication) {
        Long managerId = extractUserId(authentication);
        Signalement signalement = problemeService.convertToSignalement(id, managerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(signalement);
    }

    private Long extractUserId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable pour l'email " + email));
    }
}
