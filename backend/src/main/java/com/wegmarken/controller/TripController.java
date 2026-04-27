package com.wegmarken.controller;

import com.wegmarken.domain.Stop;
import com.wegmarken.domain.Trip;
import com.wegmarken.domain.TripImage;
import com.wegmarken.service.TripService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "*") // For prototype
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @PostMapping
    public ResponseEntity<Trip> createTrip(@RequestBody Trip trip) {
        return ResponseEntity.ok(tripService.createTrip(trip));
    }

    @GetMapping
    public ResponseEntity<List<Trip>> getAllTrips() {
        return ResponseEntity.ok(tripService.getAllTrips());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTrip(id));
    }

    @PostMapping("/{tripId}/stops")
    public ResponseEntity<Stop> addStop(@PathVariable Long tripId, @RequestBody Stop stop) {
        return ResponseEntity.ok(tripService.addStop(tripId, stop));
    }

    @PutMapping("/{tripId}/stops/{stopId}")
    public ResponseEntity<Stop> updateStop(@PathVariable Long tripId, @PathVariable Long stopId, @RequestBody Stop stop) {
        return ResponseEntity.ok(tripService.updateStop(tripId, stopId, stop));
    }

    @PostMapping("/{tripId}/images")
    public ResponseEntity<TripImage> uploadImage(
            @PathVariable Long tripId,
            @RequestParam(required = false) Long stopId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(tripService.addImage(tripId, stopId, file));
    }

    @PostMapping("/{tripId}/bulk-images")
    public ResponseEntity<List<TripImage>> uploadImagesBulk(
            @PathVariable Long tripId,
            @RequestParam("files") MultipartFile[] files) {
        return ResponseEntity.ok(tripService.bulkAddImages(tripId, files));
    }

    @PutMapping("/{tripId}/images/{imageId}/assign/{stopId}")
    public ResponseEntity<TripImage> assignImageToStop(
            @PathVariable Long tripId,
            @PathVariable Long imageId,
            @PathVariable Long stopId) {
        return ResponseEntity.ok(tripService.assignImageToStop(tripId, imageId, stopId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{tripId}/stops/{stopId}")
    public ResponseEntity<Void> deleteStop(@PathVariable Long tripId, @PathVariable Long stopId) {
        tripService.deleteStop(tripId, stopId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<Void> inviteToTrip(@PathVariable Long id, @RequestBody Map<String, String> body) {
        tripService.inviteToTrip(id, body.get("username"));
        return ResponseEntity.ok().build();
    }
}
