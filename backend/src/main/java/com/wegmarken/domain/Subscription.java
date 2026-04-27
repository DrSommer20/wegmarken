package com.wegmarken.domain;

import jakarta.persistence.Embeddable;
import lombok.Data;

/**
 * We wrap the subscription and storage stuff in this Embeddable class.
 * Keeps the User entity a bit cleaner and groups related fields together.
 */
@Embeddable
@Data
public class Subscription {
    
    // Everyone starts on the free tier initially
    private String tier = "FREE";
    
    // Track how much space they're taking up with their images
    private Double usedStorageMb = 0.0;
    
    // 500 MB seems like a fair starting point for free accounts
    private Double maxStorageMb = 500.0; 
    
    /**
     * Quick helper to check if they've hit their limit.
     * Makes it easier to block uploads later on.
     */
    public boolean hasReachedLimit() {
        // -1 or null could mean unlimited in the future, just handling it here early on
        if (maxStorageMb == null || maxStorageMb < 0) return false; 
        return usedStorageMb >= maxStorageMb;
    }
}
