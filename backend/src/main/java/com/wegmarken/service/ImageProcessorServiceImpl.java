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
}
