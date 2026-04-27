package com.wegmarken.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service to handle subscription logic and quota calculations.
 * Values are pulled from environment variables / application.properties.
 */
@Service
public class SubscriptionService {

    @Value("${quota.backpacker}")
    private double backpackerQuota;

    @Value("${quota.explorer}")
    private double explorerQuota;

    @Value("${quota.globetrotter}")
    private double globetrotterQuota;

    /**
     * Get the base storage limit for a given tier.
     */
    public double getBaseQuota(String tier) {
        if (tier == null) return backpackerQuota;
        
        // Simple switch to match the tier string to the configured value
        return switch (tier.toUpperCase()) {
            case "EXPLORER" -> explorerQuota;
            case "GLOBETROTTER" -> globetrotterQuota;
            default -> backpackerQuota; // Fallback to Backpacker
        };
    }
}
