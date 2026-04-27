package com.wegmarken.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    private String email;
    private String mapPreference = "standard";
    
    // Grouped the subscription config into its own object to keep this clean
    @Embedded
    private Subscription subscription = new Subscription();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Trip> trips = new ArrayList<>();
}
