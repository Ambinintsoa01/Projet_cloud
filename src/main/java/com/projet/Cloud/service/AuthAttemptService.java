package com.projet.Cloud.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.projet.Cloud.exception.AccountLockedException;
import com.projet.Cloud.model.AccountLock;
import com.projet.Cloud.model.LoginAttempt;
import com.projet.Cloud.model.User;
import com.projet.Cloud.repository.AccountLockRepository;
import com.projet.Cloud.repository.LoginAttemptRepository;
import com.projet.Cloud.repository.UserRepository;

@Service
public class AuthAttemptService {

    @Value("${auth.max-attempts:3}")
    private int maxAttempts;

    @Value("${auth.lockout-duration:900000}") // en millisecondes
    private long lockDurationMs;

    private final AccountLockRepository lockRepo;
    private final LoginAttemptRepository attemptRepo;
    private final UserRepository userRepository;

    public AuthAttemptService(AccountLockRepository lockRepo,
                              LoginAttemptRepository attemptRepo,
                              UserRepository userRepository) {
        this.lockRepo = lockRepo;
        this.attemptRepo = attemptRepo;
        this.userRepository = userRepository;
    }

    // 🔒 Vérification avant login
    public void checkIfLocked(String username) {
        lockRepo.findByUsername(username).ifPresent(lock -> {
            if (lock.isLocked() &&
                lock.getLockedUntil() != null &&
                lock.getLockedUntil().isAfter(LocalDateTime.now())) {

                throw new AccountLockedException(username, lock.getLockedUntil().toString());
            }
        });
    }

    // ❌ Échec de login
    public void loginFailed(String username) {

        attemptRepo.save(createAttempt(username, false));

        AccountLock lock = lockRepo.findByUsername(username)
                .orElseGet(() -> {
                    AccountLock l = new AccountLock();
                    l.setUsername(username);
                    l.setFailedAttempts(0);
                    l.setLocked(false);
                    return l;
                });

        int attempts = lock.getFailedAttempts() + 1;
        lock.setFailedAttempts(attempts);

        if (attempts >= maxAttempts) {
            lock.setLocked(true);
            lock.setLockedUntil(LocalDateTime.now().plusNanos(lockDurationMs * 1_000_000));
        }

        lockRepo.save(lock);
    }

    // ✅ Succès de login
    public void loginSucceeded(String username) {
        attemptRepo.save(createAttempt(username, true));
        lockRepo.deleteById(username);
    }

    private LoginAttempt createAttempt(String username, boolean success) {
        LoginAttempt attempt = new LoginAttempt();
        attempt.setUsername(username);
        attempt.setSuccess(success);
        attempt.setAttemptTime(LocalDateTime.now());
        return attempt;
    }

    public void unlockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        lockRepo.findByUsername(user.getEmail()).ifPresent(lockRepo::delete);
    }
}
