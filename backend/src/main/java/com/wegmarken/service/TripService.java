package com.wegmarken.service;

import com.wegmarken.domain.Stop;
import com.wegmarken.domain.Trip;
import com.wegmarken.domain.TripImage;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TripService {
    Trip createTrip(Trip trip);
    Trip getTrip(Long id);
    List<Trip> getAllTrips();
    
    Stop addStop(Long tripId, Stop stop);
    Stop updateStop(Long tripId, Long stopId, Stop stop);
    
    TripImage addImage(Long tripId, Long stopId, MultipartFile file);
    
    List<TripImage> bulkAddImages(Long tripId, MultipartFile[] files);
    
    TripImage assignImageToStop(Long tripId, Long imageId, Long stopId);
    
    void deleteTrip(Long id);
    void deleteStop(Long tripId, Long stopId);
    
    void inviteToTrip(Long tripId, String username);
}
