package com.projet.Cloud.service;

import com.projet.Cloud.dto.ConvertProblemeRequest;
import com.projet.Cloud.dto.CreateProblemeRequest;
import com.projet.Cloud.dto.CreateSignalementRequest;
import com.projet.Cloud.model.Probleme;
import com.projet.Cloud.model.Signalement;
import com.projet.Cloud.model.SignalementType;
import com.projet.Cloud.model.User;
import com.projet.Cloud.repository.ProblemeRepository;
import com.projet.Cloud.repository.SignalementTypeRepository;
import com.projet.Cloud.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProblemeService {

    private final ProblemeRepository problemeRepository;
    private final UserRepository userRepository;
    private final SignalementTypeRepository typeRepository;
    private final SignalementService signalementService;

    public Probleme createProbleme(CreateProblemeRequest request, Long userId) {
        log.info("Création d'un problème par l'utilisateur {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        SignalementType type = null;
        if (request.getTypeId() != null) {
            type = typeRepository.findById(request.getTypeId())
                    .orElseThrow(() -> new RuntimeException("Type de signalement introuvable"));
        }

        Probleme probleme = new Probleme();
        probleme.setUser(user);
        probleme.setType(type);
        probleme.setLatitude(request.getLatitude());
        probleme.setLongitude(request.getLongitude());
        probleme.setDescription(request.getDescription());
        probleme.setStatus("ouvert");
        probleme.setCreatedAt(LocalDateTime.now());

        return problemeRepository.save(probleme);
    }

    public List<Probleme> listProblemes() {
        return problemeRepository.findAll();
    }

    public List<Probleme> listProblemesOuverts() {
        return problemeRepository.findByStatus("ouvert");
    }

    public List<Probleme> listProblemesByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return problemeRepository.findByUser(user);
    }

    @Transactional
    public Signalement convertToSignalement(Long problemeId, Long managerId, ConvertProblemeRequest request) {
        log.info("Conversion du problème {} en signalement par manager {}", problemeId, managerId);

        Probleme probleme = problemeRepository.findById(problemeId)
                .orElseThrow(() -> new RuntimeException("Problème introuvable"));

        if (!"ouvert".equalsIgnoreCase(probleme.getStatus())) {
            throw new RuntimeException("Ce problème n'est plus convertible (statut: " + probleme.getStatus() + ")");
        }

        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager introuvable"));

        SignalementType type = typeRepository.findById(request.getTypeId())
                .orElseThrow(() -> new RuntimeException("Type de signalement introuvable"));

        // Construire la requête de signalement à partir du problème + des compléments manager
        CreateSignalementRequest sigRequest = new CreateSignalementRequest(
                probleme.getLatitude(),
                probleme.getLongitude(),
                type.getId(),
                request.getDescription(),
                request.getSurfaceM2(),
                request.getBudget(),
                request.getNiveau()
        );

        Signalement signalementCree = signalementService.createSignalement(sigRequest, probleme.getUser().getId());

        // Marquer le problème comme converti
        probleme.setStatus("converti");
        probleme.setConvertedAt(LocalDateTime.now());
        probleme.setConvertedBy(manager);
        probleme.setType(type);
        probleme.setUpdatedAt(LocalDateTime.now());
        problemeRepository.save(probleme);

        return signalementCree;
    }
}
