package com.wegmarken.domain;

import jakarta.persistence.Embeddable;
import lombok.Data;

/**
 * Handles everything related to the user's plan and storage.
 * We use three tiers: BACKPACKER, EXPLORER, and GLOBETROTTER.
 */
@Embeddable
@Data
public class Subscription {
    
    // Default tier is BACKPACKER (the free one)
    private String tier = "BACKPACKER";
    
    // Current usage in MegaBytes
    private Double usedStorageMb = 0.0;
    
    // Allows us to grant extra space to specific users (e.g. for loyalty or promos)
    private Double extraQuotaMb = 0.0;
}
