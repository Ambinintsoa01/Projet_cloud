package com.projet.Cloud.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "auth")

public class AuthSecurityProperties {

    private int maxAttempts;
    private long lockoutDuration;
    public int getMaxAttempts() {
        return maxAttempts;
    }
    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }
    public long getLockoutDuration() {
        return lockoutDuration;
    }
    public void setLockoutDuration(long lockoutDuration) {
        this.lockoutDuration = lockoutDuration;
    }
}

