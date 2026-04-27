package com.wegmarken.controller;

import com.wegmarken.domain.User;
import com.wegmarken.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/friends")
@CrossOrigin(origins = "*")
public class FriendsController {

    private final UserRepository userRepository;

    public FriendsController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Returns a safe list of friends (only id + username, no password/email/etc).
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getFriends() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        
        List<Map<String, Object>> safeFriends = user.getFriends().stream()
                .map(f -> Map.<String, Object>of("id", f.getId(), "username", f.getUsername()))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(safeFriends);
    }

    @PostMapping("/add")
    public ResponseEntity<Void> addFriend(@RequestBody Map<String, String> body) {
        String friendUsername = body.get("username");
        String myUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        
        if (myUsername.equals(friendUsername)) {
            return ResponseEntity.badRequest().build();
        }

        User me = userRepository.findByUsername(myUsername).orElseThrow();
        User friend = userRepository.findByUsername(friendUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!me.getFriends().contains(friend)) {
            me.getFriends().add(friend);
            // Bidirectional for simplicity in prototype
            if (!friend.getFriends().contains(me)) {
                friend.getFriends().add(me);
            }
            userRepository.save(me);
            userRepository.save(friend);
        }

        return ResponseEntity.ok().build();
    }
}
