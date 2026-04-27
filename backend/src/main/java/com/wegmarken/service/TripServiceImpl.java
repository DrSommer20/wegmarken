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

    public TripServiceImpl(TripRepository tripRepository, StopRepository stopRepository, 
                           TripImageRepository tripImageRepository, ImageProcessorService imageProcessorService,
                           com.wegmarken.repository.UserRepository userRepository) {
        this.tripRepository = tripRepository;
        this.stopRepository = stopRepository;
        this.tripImageRepository = tripImageRepository;
        this.imageProcessorService = imageProcessorService;
        this.userRepository = userRepository;
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
    public TripImage addImage(Long tripId, Long stopId, MultipartFile file) {
        Trip trip = getTrip(tripId);
        Stop stop = null;
        if (stopId != null) {
            stop = stopRepository.findById(stopId).orElse(null);
        }

        Map<String, Double> coords = imageProcessorService.extractGpsCoordinates(file);
        
        TripImage image = new TripImage();
        image.setTrip(trip);
        image.setStop(stop);
        
        // Mocking saving the file locally or to S3. For prototype, we could just convert to Base64 or save in a local dir.
        // Let's assume we save to a public folder and create a URL
        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        // In a real scenario we save it. Here we just set a mock URL
        image.setFileName(filename);
        image.setUrl("/images/" + filename);

        if (coords.containsKey("latitude")) {
            image.setLatitude(coords.get("latitude"));
            image.setLongitude(coords.get("longitude"));
        } else if (stop != null && stop.getLatitude() != null) {
            // Fallback to stop coordinates
            image.setLatitude(stop.getLatitude());
            image.setLongitude(stop.getLongitude());
        }

        return tripImageRepository.save(image);
    }
}
