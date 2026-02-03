package com.projet.Cloud.repository;

import com.projet.Cloud.model.LoginAttempt;

import io.jsonwebtoken.security.Jwks.OP;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    // Optional<LoginAttempt> deleteById(String username);
    void deleteByUsername(String username);
    long countByUsernameAndSuccessFalse(String username);
    
}