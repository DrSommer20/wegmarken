package com.wegmarken.service;

import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

public interface ImageProcessorService {
    /**
     * Extracts GPS Latitude and Longitude from the given image file.
     * @param file the image file
     * @return A map containing "latitude" and "longitude" if present, otherwise empty.
     */
    Map<String, Double> extractGpsCoordinates(MultipartFile file);
}
