package com.wegmarken.service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.GpsDirectory;
import com.drew.lang.GeoLocation;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Service
public class ImageProcessorServiceImpl implements ImageProcessorService {

    @Override
    public Map<String, Double> extractGpsCoordinates(MultipartFile file) {
        Map<String, Double> coordinates = new HashMap<>();
        try (InputStream is = file.getInputStream()) {
            Metadata metadata = ImageMetadataReader.readMetadata(is);
            GpsDirectory gpsDirectory = metadata.getFirstDirectoryOfType(GpsDirectory.class);
            
            if (gpsDirectory != null) {
                GeoLocation geoLocation = gpsDirectory.getGeoLocation();
                if (geoLocation != null) {
                    coordinates.put("latitude", geoLocation.getLatitude());
                    coordinates.put("longitude", geoLocation.getLongitude());
                }
            }
        } catch (Exception e) {
            // Log error in real app, ignore for prototype if no GPS found
            e.printStackTrace();
        }
        return coordinates;
    }

    @Override
    public String getCityFromCoordinates(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) return "Unbekannter Ort";
        
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            
            // Nominatim requires a user-agent to avoid blocking
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "WegmarkenApp/1.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);

            String url = String.format(java.util.Locale.US, "https://nominatim.openstreetmap.org/reverse?format=json&lat=%f&lon=%f", latitude, longitude);
            
            org.springframework.http.ResponseEntity<Map> response = restTemplate.exchange(
                    url, org.springframework.http.HttpMethod.GET, entity, Map.class);
                    
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> address = (Map<String, Object>) response.getBody().get("address");
                if (address != null) {
                    if (address.containsKey("city")) return (String) address.get("city");
                    if (address.containsKey("town")) return (String) address.get("town");
                    if (address.containsKey("village")) return (String) address.get("village");
                    if (address.containsKey("municipality")) return (String) address.get("municipality");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "Neuer Stop";
    }
}
