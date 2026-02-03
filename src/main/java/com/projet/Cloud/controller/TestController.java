package com.projet.Cloud.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TestController {

    @GetMapping("/secure")
    public String secureEndpoint(Authentication authentication) {
        return "Connecté avec UID : " + authentication.getName();
    }
}
