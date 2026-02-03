package com.projet.Cloud.service;

import com.projet.Cloud.dto.AuthResponse;
import com.projet.Cloud.dto.LoginRequest;
import com.projet.Cloud.dto.RegisterRequest;
import com.projet.Cloud.dto.UpdateUserRequest;
import com.projet.Cloud.model.Role;
import com.projet.Cloud.model.User;
import com.projet.Cloud.repository.RoleRepository;
import com.projet.Cloud.repository.UserRepository;
import com.projet.Cloud.util.JwtUtil;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class LocalAuthServiceImpl implements LocalAuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Autowired
    public LocalAuthServiceImpl(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public Optional <User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public AuthResponse authenticate(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }

        User user = userOpt.get();
        
        // Extraire les noms des rôles
        Set<String> roleNames = new HashSet<>();
        for (Role role : user.getRoles()) {
            roleNames.add(role.getName());
        }
        
        // Créer les claims pour le JWT
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());
        claims.put("username", user.getUsername());
        claims.put("roles", roleNames);
        
        AuthResponse response = new AuthResponse();
        response.setToken(JwtUtil.generateToken(claims)); // JWT
        response.setExpiresAt(System.currentTimeMillis() + 3600000); // 1h
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setRoles(roleNames);
        return response;
    }


    @Override
    public AuthResponse register(RegisterRequest request) {
        User user = new User();
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        String requestedRole = request.getRole();
        String roleToFind = (requestedRole == null || requestedRole.isBlank()) ? "USER" : requestedRole;
        Role role = roleRepository.findByName(roleToFind)
            .orElseThrow(() -> new RuntimeException("Rôle introuvable : " + roleToFind));
        user.setRoles(Set.of(role)); // un seul rôle, mais User attend un Set

        userRepository.save(user);

        // Extraire les noms des rôles
        Set<String> roleNames = new HashSet<>();
        for (Role r : user.getRoles()) {
            roleNames.add(r.getName());
        }

        // Créer les claims pour le JWT
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());
        claims.put("username", user.getUsername());
        claims.put("roles", roleNames);

        AuthResponse response = new AuthResponse();
        response.setToken(JwtUtil.generateToken(claims)); // JWT
        response.setExpiresAt(System.currentTimeMillis() + 3600000);
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setRoles(roleNames);
        return response;
    }

    @Override
    public User updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            user.setUsername(request.getUsername());
        }

        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            user.setEmail(request.getEmail());
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return userRepository.save(user);
    }




}
