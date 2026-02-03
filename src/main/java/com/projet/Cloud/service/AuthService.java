package com.projet.Cloud.service;

import com.projet.Cloud.dto.AuthResponse;
import com.projet.Cloud.dto.LoginRequest;
import com.projet.Cloud.dto.RegisterRequest;

public interface AuthService {
    AuthResponse authenticate(LoginRequest request);
    AuthResponse register(RegisterRequest request);

    
}
