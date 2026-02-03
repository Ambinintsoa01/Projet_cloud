package com.projet.Cloud.service;

import com.projet.Cloud.dto.AuthResponse;
import com.projet.Cloud.dto.LoginRequest;
import com.projet.Cloud.dto.RegisterRequest;
import com.projet.Cloud.dto.UpdateUserRequest;
import com.projet.Cloud.model.User;
import com.projet.Cloud.repository.UserRepository;
import com.projet.Cloud.repository.RoleRepository;
import com.projet.Cloud.service.AuthService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import com.projet.Cloud.model.Role;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class FirebaseAuthService implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public FirebaseAuthService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        // 1️⃣ Créer l’utilisateur en base
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // Assign default role USER when registering via Firebase
        String requestedRole = request.getRole();
        final String roleToUse = (requestedRole == null || requestedRole.isBlank()) ? "USER" : requestedRole;
        com.projet.Cloud.model.Role role = roleRepository.findByName(roleToUse)
            .orElseThrow(() -> new RuntimeException("Rôle introuvable : " + roleToUse));
        user.setRoles(Set.of(role));
        userRepository.save(user);

        // 2️⃣ Créer l’utilisateur dans Firebase
        UserRecord.CreateRequest firebaseRequest = new UserRecord.CreateRequest()
                .setEmail(request.getEmail())
                .setPassword(request.getPassword())
                .setDisplayName(request.getUsername());

        UserRecord firebaseUser;
        try {
            firebaseUser = FirebaseAuth.getInstance().createUser(firebaseRequest);
        } catch (FirebaseAuthException e) {
            throw new RuntimeException("Impossible de créer l'utilisateur Firebase: " + e.getMessage());
        }

        // 4️⃣ Extraire les noms des rôles
        Set<String> roleNames = new HashSet<>();
        for (Role userRole : user.getRoles()) {
            roleNames.add(userRole.getName());
        }
        // 5️⃣ Générer un JWT signé par le serveur (compatible avec JwtUtil)
        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("uid", user.getId().toString());
        claims.put("email", user.getEmail());
        claims.put("username", user.getUsername());
        claims.put("roles", new java.util.ArrayList<>(roleNames));

        String serverToken = com.projet.Cloud.util.JwtUtil.generateToken(claims, 3600000);

        // 6️⃣ Retourner la réponse complète avec les rôles
        AuthResponse response = new AuthResponse();
        response.setToken(serverToken);
        response.setExpiresAt(System.currentTimeMillis() + 3600000); // 1h
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setRoles(roleNames);
        return response;
    }

    @Override
    public AuthResponse authenticate(LoginRequest request) {
        // Récupérer l'utilisateur ou lever une exception
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Vérifier le mot de passe
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        // Extraire les noms des rôles
        Set<String> roleNames = new HashSet<>();
        for (Role userRole : user.getRoles()) {
            roleNames.add(userRole.getName());
        }

        // Générer un token signé par le serveur (au lieu d'un custom token Firebase)
        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("uid", user.getId().toString());
        claims.put("email", user.getEmail());
        claims.put("username", user.getUsername());
        claims.put("roles", new java.util.ArrayList<>(roleNames));

        String serverToken = com.projet.Cloud.util.JwtUtil.generateToken(claims, 3600000);

        // Retourner la réponse complète avec les rôles
        AuthResponse response = new AuthResponse();
        response.setToken(serverToken);
        response.setExpiresAt(System.currentTimeMillis() + 3600000); // 1h
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setRoles(roleNames);
        return response;
    }

    public void updateFirebaseUser(User user, UpdateUserRequest request) throws FirebaseAuthException {
        UserRecord.UpdateRequest updateRequest = new UserRecord.UpdateRequest(user.getFirebaseUid());

        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            updateRequest.setEmail(request.getEmail());
        }

        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            updateRequest.setDisplayName(request.getUsername());
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            updateRequest.setPassword(request.getPassword());
        }

        FirebaseAuth.getInstance().updateUser(updateRequest);
    }


}
