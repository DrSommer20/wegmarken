package com.wegmarken.service;

import com.wegmarken.domain.Stop;
import com.wegmarken.domain.Trip;
import com.wegmarken.domain.TripImage;
import com.wegmarken.repository.StopRepository;
import com.wegmarken.repository.TripImageRepository;
import com.wegmarken.repository.TripRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TripServiceImpl implements TripService {

    private final TripRepository tripRepository;
    private final StopRepository stopRepository;
    private final TripImageRepository tripImageRepository;
    private final ImageProcessorService imageProcessorService;
    private final com.wegmarken.repository.UserRepository userRepository;
    private final S3Service s3Service;

    public TripServiceImpl(TripRepository tripRepository, StopRepository stopRepository, 
                           TripImageRepository tripImageRepository, ImageProcessorService imageProcessorService,
                           com.wegmarken.repository.UserRepository userRepository, S3Service s3Service) {
        this.tripRepository = tripRepository;
        this.stopRepository = stopRepository;
        this.tripImageRepository = tripImageRepository;
        this.imageProcessorService = imageProcessorService;
        this.userRepository = userRepository;
        this.s3Service = s3Service;
    }

    @Override
    public Trip createTrip(Trip trip) {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.wegmarken.domain.User user = userRepository.findByUsername(username).orElseThrow();
        trip.setUser(user);
        return tripRepository.save(trip);
    }

    @Override
    public Trip getTrip(Long id) {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        Trip trip = tripRepository.findById(id).orElseThrow(() -> new RuntimeException("Trip not found"));
        if (!trip.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized access to trip");
        }
        return trip;
    }

    @Override
    public List<Trip> getAllTrips() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.wegmarken.domain.User user = userRepository.findByUsername(username).orElseThrow();
        return tripRepository.findByUserId(user.getId());
    }

    @Override
    public Stop addStop(Long tripId, Stop stop) {
        Trip trip = getTrip(tripId);
        stop.setTrip(trip);
        return stopRepository.save(stop);
    }

    @Override
    public Stop updateStop(Long tripId, Long stopId, Stop updatedStop) {
        Trip trip = getTrip(tripId);
        Stop stop = stopRepository.findById(stopId)
                .orElseThrow(() -> new RuntimeException("Stop not found"));
        if (!stop.getTrip().getId().equals(trip.getId())) {
            throw new RuntimeException("Stop does not belong to this trip");
        }
        stop.setName(updatedStop.getName());
        stop.setDescription(updatedStop.getDescription());
        stop.setStopDate(updatedStop.getStopDate());
        stop.setSortOrder(updatedStop.getSortOrder());
        stop.setLatitude(updatedStop.getLatitude());
        stop.setLongitude(updatedStop.getLongitude());
        return stopRepository.save(stop);
    }

    @Override
    public TripImage addImage(Long tripId, Long stopId, MultipartFile file) {
        Trip trip = getTrip(tripId);
        Stop stop = null;
        if (stopId != null) {
            stop = stopRepository.findById(stopId).orElse(null);
        }

        Map<String, Double> coords = imageProcessorService.extractGpsCoordinates(file);
        String s3Url = s3Service.uploadFile(file);
        
        TripImage image = new TripImage();
        image.setTrip(trip);
        image.setStop(stop);
        image.setFileName(file.getOriginalFilename());
        image.setUrl(s3Url);

        if (coords.containsKey("latitude")) {
            image.setLatitude(coords.get("latitude"));
            image.setLongitude(coords.get("longitude"));
        } else if (stop != null && stop.getLatitude() != null) {
            image.setLatitude(stop.getLatitude());
            image.setLongitude(stop.getLongitude());
        }

        return tripImageRepository.save(image);
    }

    @Override
    public List<TripImage> bulkAddImages(Long tripId, MultipartFile[] files) {
        Trip trip = getTrip(tripId);
        List<TripImage> savedImages = new java.util.ArrayList<>();
        
        class ImageMeta {
            MultipartFile file;
            Double lat;
            Double lng;
        }
        
        List<ImageMeta> gpsImages = new java.util.ArrayList<>();
        List<ImageMeta> noGpsImages = new java.util.ArrayList<>();

        for (MultipartFile file : files) {
            ImageMeta meta = new ImageMeta();
            meta.file = file;
            Map<String, Double> coords = imageProcessorService.extractGpsCoordinates(file);
            if (coords.containsKey("latitude")) {
                double lat = coords.get("latitude");
                double lng = coords.get("longitude");
                // Treat 0,0 (null island) as invalid - almost certainly means no real GPS data
                if (Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001) {
                    noGpsImages.add(meta);
                } else {
                    meta.lat = lat;
                    meta.lng = lng;
                    gpsImages.add(meta);
                }
            } else {
                noGpsImages.add(meta);
            }
        }

        // Clustering: ~2km = ~0.018 degrees
        double clusterThreshold = 0.018;
        List<List<ImageMeta>> clusters = new java.util.ArrayList<>();
        
        for (ImageMeta img : gpsImages) {
            boolean added = false;
            for (List<ImageMeta> cluster : clusters) {
                ImageMeta first = cluster.get(0);
                double dLat = img.lat - first.lat;
                double dLng = img.lng - first.lng;
                double dist = Math.sqrt(dLat * dLat + dLng * dLng);
                if (dist <= clusterThreshold) {
                    cluster.add(img);
                    added = true;
                    break;
                }
            }
            if (!added) {
                List<ImageMeta> newCluster = new java.util.ArrayList<>();
                newCluster.add(img);
                clusters.add(newCluster);
            }
        }

        // Process clusters
        int nextSortOrder = trip.getStops() != null ? trip.getStops().size() : 0;
        
        for (List<ImageMeta> cluster : clusters) {
            // Create stop for cluster
            ImageMeta center = cluster.get(0);
            String cityName = imageProcessorService.getCityFromCoordinates(center.lat, center.lng);
            
            Stop newStop = new Stop();
            newStop.setTrip(trip);
            newStop.setName(cityName);
            newStop.setLatitude(center.lat);
            newStop.setLongitude(center.lng);
            newStop.setSortOrder(nextSortOrder++);
            // Use current date for stop date (could be extracted from EXIF but keep it simple for now)
            newStop.setStopDate(java.time.LocalDate.now());
            
            newStop = stopRepository.save(newStop);

            for (ImageMeta img : cluster) {
                String s3Url = s3Service.uploadFile(img.file);
                TripImage ti = new TripImage();
                ti.setTrip(trip);
                ti.setStop(newStop);
                ti.setLatitude(img.lat);
                ti.setLongitude(img.lng);
                ti.setFileName(img.file.getOriginalFilename());
                ti.setUrl(s3Url);
                savedImages.add(tripImageRepository.save(ti));
            }
        }

        // Process no GPS images
        for (ImageMeta img : noGpsImages) {
            String s3Url = s3Service.uploadFile(img.file);
            TripImage ti = new TripImage();
            ti.setTrip(trip);
            ti.setFileName(img.file.getOriginalFilename());
            ti.setUrl(s3Url);
            savedImages.add(tripImageRepository.save(ti));
        }

        return savedImages;
    }

    @Override
    public TripImage assignImageToStop(Long tripId, Long imageId, Long stopId) {
        Trip trip = getTrip(tripId);
        TripImage image = tripImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found"));
        if (!image.getTrip().getId().equals(trip.getId())) {
            throw new RuntimeException("Image does not belong to this trip");
        }
        Stop stop = stopRepository.findById(stopId)
                .orElseThrow(() -> new RuntimeException("Stop not found"));
        if (!stop.getTrip().getId().equals(trip.getId())) {
            throw new RuntimeException("Stop does not belong to this trip");
        }
        image.setStop(stop);
        return tripImageRepository.save(image);
    }
}
