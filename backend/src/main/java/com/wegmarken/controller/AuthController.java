package com.wegmarken.controller;

import com.wegmarken.domain.User;
import com.wegmarken.repository.UserRepository;
import com.wegmarken.security.JwtUtil;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
                          PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Standard registration. We check if the name is taken, 
     * then hash the password and save.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(token));
    }

    /**
     * Login - if successful, we return a JWT. 
     * Spring Security handles the heavy lifting here.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        String token = jwtUtil.generateToken(request.getUsername());
        return ResponseEntity.ok(new AuthResponse(token));
    }

    @Data
    static class AuthRequest {
        private String username;
        private String password;
    }

    @Data
    static class AuthResponse {
        private String token;
        public AuthResponse(String token) { this.token = token; }
    }

    @Data
    static class PasswordChangeRequest {
        private String oldPassword;
        private String newPassword;
    }

    @Data
    static class PreferenceRequest {
        private String mapType;
    }

    /**
     * Returns the full profile of the logged-in user.
     * Useful for getting subscription status and preferences.
     */
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(java.security.Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    /**
     * Change password - needs the old one to verify it's really the user.
     */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(java.security.Principal principal, @RequestBody PasswordChangeRequest request) {
        User user = userRepository.findByUsername(principal.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Altes Passwort ist falsch"));
        }
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(java.security.Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
        return ResponseEntity.ok().build();
    }

    /**
     * Save small UI preferences like map type (satellite vs standard)
     */
    @PutMapping("/preferences")
    public ResponseEntity<?> updatePreferences(java.security.Principal principal, @RequestBody PreferenceRequest request) {
        User user = userRepository.findByUsername(principal.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setMapPreference(request.getMapType());
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }
}
