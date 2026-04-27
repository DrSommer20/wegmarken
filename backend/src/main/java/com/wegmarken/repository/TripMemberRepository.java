package com.wegmarken.repository;

import com.wegmarken.domain.TripMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TripMemberRepository extends JpaRepository<TripMember, Long> {
    List<TripMember> findByUserIdAndDeletedLocallyFalse(Long userId);
    Optional<TripMember> findByTripIdAndUserId(Long tripId, Long userId);
}
