package com.projet.Cloud.exception;

public class AccountLockedException extends RuntimeException {

    private final String username;
    private final String until; // date/heure de déblocage

    public AccountLockedException(String username, String until) {
        super("Compte bloqué temporairement jusqu'à " + until);
        this.username = username;
        this.until = until;
    }

    // ✅ Les getters doivent être publics
    public String getUsername() {
        return username;
    }

    public String getUntil() {
        return until;
    }
}
