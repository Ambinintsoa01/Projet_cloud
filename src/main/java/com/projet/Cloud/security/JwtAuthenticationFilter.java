// package com.projet.Cloud.security;

// import org.springframework.web.filter.OncePerRequestFilter;

// import jakarta.persistence.*;


// import java.io.IOException;

// public class JwtAuthenticationFilter extends OncePerRequestFilter {

//     private final JwtTokenProvider tokenProvider;

//     public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
//         this.tokenProvider = tokenProvider;
//     }

//     @Override
//     protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
//             throws ServletException, IOException {
//         // Extract token and validate (placeholder)
//         filterChain.doFilter(request, response);
//     }
// }
