package com.projet.Cloud.config;

import com.projet.Cloud.util.JwtUtil;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {

    private final JwtProperties jwtProperties;

    public JwtConfig(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    @PostConstruct
    public void init() {
        JwtUtil.init(jwtProperties.getSecret());
    }
}
