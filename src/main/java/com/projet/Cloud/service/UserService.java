package com.projet.Cloud.service;

import com.projet.Cloud.model.User;
import com.projet.Cloud.repository.AccountLockRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.projet.Cloud.repository.UserRepository;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    
    private UserRepository UserRepository;
    private AccountLockRepository accountLockRepository;
    
     @Autowired
    public void setUserRepository(UserRepository UserRepository) {
        this.UserRepository = UserRepository;
    }

     @Autowired
    public void setAccountLockRepository(AccountLockRepository accountLockRepository) {
        this.accountLockRepository = accountLockRepository;
    }

     public User save(User User) {
        return UserRepository.save(User);
    }

    public List<User> findAll() {
        return UserRepository.findAll();
    }

    public Optional<User> findById(Long id) { 
        return UserRepository.findById(id);
    }

    public void deleteById(Long id) { 
        UserRepository.deleteById(id);
    }

    public User update(User User) {
        return UserRepository.save(User); // save() fait update s’il y a déjà un ID
    }

    public Optional<User> findByEmail(String email) {
        return UserRepository.findByUsername(email);
    }

    /**
     * Récupérer les utilisateurs bloqués (ayant un AccountLock actif)
     */
    public List<User> findBlockedUsers() {
        // Récupérer tous les utilisateurs bloqués de la table account_lock
        List<String> blockedEmails = accountLockRepository.findAll()
                .stream()
                .filter(lock -> lock.isLocked())
                .map(lock -> lock.getUsername())
                .collect(Collectors.toList());

        // Retourner les utilisateurs correspondants
        return blockedEmails.isEmpty() ? List.of() : 
               UserRepository.findAll()
                   .stream()
                   .filter(user -> blockedEmails.contains(user.getEmail()))
                   .collect(Collectors.toList());
    }



}