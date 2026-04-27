package com.wegmarken.controller;

import com.wegmarken.domain.User;
import com.wegmarken.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
@CrossOrigin(origins = "*")
public class FriendsController {

    private final UserRepository userRepository;

    public FriendsController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<User>> getFriends() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        return ResponseEntity.ok(user.getFriends());
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
