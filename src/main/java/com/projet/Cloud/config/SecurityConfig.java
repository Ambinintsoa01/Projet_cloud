package com.projet.Cloud.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.projet.Cloud.security.FirebaseAuthenticationFilter;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Autorise les origines locales et mobiles
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://172.21.145.209:8080",
            "http://172.21.145.209:5173",
            "http://172.20.10.3:8080",    // IP du Mac visible depuis iPhone
            "capacitor://localhost",       // Capacitor iOS
            "ionic://localhost",           // Ionic
            "http://localhost"             // WebView local
        ));
        
        // Autorise les méthodes HTTP
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        
        // Autorise les en-têtes
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.addAllowedHeader("Authorization");
        configuration.addAllowedHeader("Content-Type");
        configuration.addAllowedHeader("Accept");
        configuration.addAllowedHeader("X-Requested-With");
        
        // Autorise les credentials
        configuration.setAllowCredentials(true);
        
        // Durée de mise en cache du preflight
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            FirebaseAuthenticationFilter firebaseFilter) throws Exception {

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s ->
                s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/public/**", "/api/auth/**", "/api/init-firestore", "/actuator/**").permitAll()
                .requestMatchers("/api/signalement-types", "/api/problemes/ouverts", "/api/signalements", "/api/problemes").permitAll()
                .requestMatchers("PUT", "/api/signalements/**").permitAll()
                .requestMatchers("/api/secure", "/api/auth/user/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(
                firebaseFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
