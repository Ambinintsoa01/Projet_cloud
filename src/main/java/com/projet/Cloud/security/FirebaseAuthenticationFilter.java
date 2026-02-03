package com.projet.Cloud.security;

import com.projet.Cloud.util.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class FirebaseAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        String method = request.getMethod();
        
        // Laisser passer les requêtes publiques sans vérification du token
        if (requestPath.startsWith("/public/") || 
            requestPath.startsWith("/api/auth/") ||
            requestPath.startsWith("/actuator/") ||
            requestPath.equals("/api/init-firestore") ||
            requestPath.equals("/api/signalement-types") ||
            requestPath.equals("/api/problemes/ouverts") ||
            requestPath.equals("/api/signalements") ||
            requestPath.equals("/api/problemes") ||
            (requestPath.startsWith("/api/signalements/") && method.equals("PUT"))) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                // Try to parse as JWT token
                @SuppressWarnings("deprecation")
                Claims claims = Jwts.parser()
                        .setSigningKey(JwtUtil.getKey())
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

                String email = claims.get("email", String.class);
                String username = claims.get("username", String.class);
                
                // Extract roles from JWT claims
                @SuppressWarnings("unchecked")
                List<String> roles = (List<String>) claims.get("roles");
                if (roles == null) {
                    roles = new ArrayList<>();
                    roles.add("ROLE_USER");
                }

                // Convert roles to authorities
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                for (String role : roles) {
                    // Ensure role has ROLE_ prefix
                    String roleName = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                    authorities.add(new SimpleGrantedAuthority(roleName));
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                authorities
                        );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (Exception e) {
                // Token verification failed
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Unauthorized: Invalid token");
                return;
            }
        } else {
            // Pas de token fourni - retourner 401 pour les endpoints protégés
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Unauthorized: Missing token");
            return;
        }

        // Continuer le filtre
        filterChain.doFilter(request, response);
    }
}
