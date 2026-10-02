package com.womensafety.service;

import com.womensafety.exception.BadRequestException;
import com.womensafety.exception.ForbiddenException;
import com.womensafety.exception.ResourceNotFoundException;
import com.womensafety.model.SafeWalk;
import com.womensafety.model.User;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.LocationUpdateRequest;
import com.womensafety.model.dto.SafeWalkCreateRequest;
import com.womensafety.model.dto.SafeWalkExtendRequest;
import com.womensafety.repository.CompanionRepository;
import com.womensafety.repository.NotificationRepository;
import com.womensafety.repository.SafeWalkRepository;
import com.womensafety.repository.UserRepository;
import com.womensafety.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class SafeWalkService {

    private static final Logger log = LoggerFactory.getLogger(SafeWalkService.class);
    public static final int DEFAULT_GRACE_PERIOD_MINUTES = 10;

    private final SafeWalkRepository safeWalkRepository;
    private final CompanionRepository companionRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public SafeWalkService(
            SafeWalkRepository safeWalkRepository,
            CompanionRepository companionRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository) {
        this.safeWalkRepository = safeWalkRepository;
        this.companionRepository = companionRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    public ApiResponse<SafeWalk> createSafeWalk(SafeWalkCreateRequest request, UserPrincipal principal) {
        Long userId = principal.getId();
        Long companionId = request.getCompanionId();

        if (companionId == null) {
            throw new BadRequestException("Companion ID is required to start a Safe Walk");
        }

        if (userId.equals(companionId)) {
            throw new BadRequestException("You cannot select yourself as a Safe Walk companion");
        }

        User companion = userRepository.findById(companionId)
                .orElseThrow(() -> new ResourceNotFoundException("Selected companion user not found"));

        // Enforce requirement: A user must NOT be able to select someone as a Safe Walk companion unless the relationship has been accepted
        if (!companionRepository.areAcceptedCompanions(userId, companionId)) {
            throw new BadRequestException("You can only select an accepted companion for a Safe Walk session");
        }

        // Check if walker already has an active Safe Walk
        Optional<SafeWalk> activeWalkOpt = safeWalkRepository.findActiveWalkerJourney(userId);
        if (activeWalkOpt.isPresent()) {
            throw new BadRequestException("You already have an active Safe Walk session. Please complete or cancel it before starting a new one.");
        }

        // Calculate expected arrival
        String expectedArrival = request.getExpectedArrival();
        if ((expectedArrival == null || expectedArrival.trim().isEmpty()) && request.getExpectedDurationMinutes() != null) {
            expectedArrival = Instant.now().plus(request.getExpectedDurationMinutes(), ChronoUnit.MINUTES).toString();
        }

        Long walkId = safeWalkRepository.insert(
                userId,
                companionId,
                request.getStartLatitude(),
                request.getStartLongitude(),
                request.getDestination(),
                expectedArrival
        );

        SafeWalk walk = safeWalkRepository.findById(walkId)
                .orElseThrow(() -> new RuntimeException("Failed to retrieve created Safe Walk session"));

        evaluateTimingState(walk);

        // Notify companion
        try {
            notificationRepository.insert(
                    companionId,
                    null,
                    "Safe Walk Session Started",
                    principal.getName() + " started a Safe Walk to " + request.getDestination() + " and selected you as companion.",
                    "safe_walk_started"
            );
        } catch (Exception e) {
            log.warn("Failed to notify companion of started Safe Walk: {}", e.getMessage());
        }

        return ApiResponse.success("Safe Walk journey started successfully", walk);
    }

    public ApiResponse<SafeWalk> getActiveSafeWalk(UserPrincipal principal) {
        Optional<SafeWalk> walkOpt = safeWalkRepository.findActiveForUserOrCompanion(principal.getId());
        if (walkOpt.isEmpty()) {
            return ApiResponse.success("No active Safe Walk session", null);
        }
        SafeWalk walk = walkOpt.get();
        evaluateTimingState(walk);
        return ApiResponse.success("Active Safe Walk retrieved", walk);
    }

    public ApiResponse<SafeWalk> getSafeWalkById(Long id, UserPrincipal principal) {
        SafeWalk walk = safeWalkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Safe Walk session not found"));

        Long userId = principal.getId();
        // Strict privacy check: Only walker or designated companion can view the session
        if (!walk.getUserId().equals(userId) && !walk.getCompanionId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to view this Safe Walk session");
        }

        evaluateTimingState(walk);
        return ApiResponse.success("Safe Walk details retrieved", walk);
    }

    public ApiResponse<SafeWalk> completeSafeWalk(Long id, UserPrincipal principal) {
        SafeWalk walk = safeWalkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Safe Walk session not found"));

        // Only walker can complete the walk
        if (!walk.getUserId().equals(principal.getId())) {
            throw new ForbiddenException("Only the walker can complete this Safe Walk session");
        }

        if (!"ACTIVE".equalsIgnoreCase(walk.getStatus())) {
            throw new BadRequestException("Safe Walk session is already " + walk.getStatus().toLowerCase());
        }

        safeWalkRepository.markCompleted(id);
        walk.setStatus("COMPLETED");

        // Notify companion
        try {
            notificationRepository.insert(
                    walk.getCompanionId(),
                    null,
                    "Safe Walk Completed",
                    principal.getName() + " safely reached their destination (" + walk.getDestination() + ").",
                    "safe_walk_completed"
            );
        } catch (Exception e) {
            log.warn("Failed to notify companion of completed Safe Walk: {}", e.getMessage());
        }

        SafeWalk updated = safeWalkRepository.findById(id).orElse(walk);
        evaluateTimingState(updated);
        return ApiResponse.success("Safe Walk session marked as completed", updated);
    }

    public ApiResponse<SafeWalk> cancelSafeWalk(Long id, UserPrincipal principal) {
        SafeWalk walk = safeWalkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Safe Walk session not found"));

        // Only walker can cancel the walk
        if (!walk.getUserId().equals(principal.getId())) {
            throw new ForbiddenException("Only the walker can cancel this Safe Walk session");
        }

        if (!"ACTIVE".equalsIgnoreCase(walk.getStatus())) {
            throw new BadRequestException("Safe Walk session is already " + walk.getStatus().toLowerCase());
        }

        safeWalkRepository.markCancelled(id);
        walk.setStatus("CANCELLED");

        // Notify companion
        try {
            notificationRepository.insert(
                    walk.getCompanionId(),
                    null,
                    "Safe Walk Cancelled",
                    principal.getName() + " ended/cancelled their Safe Walk session to " + walk.getDestination() + ".",
                    "safe_walk_cancelled"
            );
        } catch (Exception e) {
            log.warn("Failed to notify companion of cancelled Safe Walk: {}", e.getMessage());
        }

        SafeWalk updated = safeWalkRepository.findById(id).orElse(walk);
        evaluateTimingState(updated);
        return ApiResponse.success("Safe Walk session cancelled", updated);
    }

    public ApiResponse<SafeWalk> updateLocation(Long id, LocationUpdateRequest request, UserPrincipal principal) {
        SafeWalk walk = safeWalkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Safe Walk session not found"));

        // Only the walker who owns the Safe Walk can update its location
        if (!walk.getUserId().equals(principal.getId())) {
            throw new ForbiddenException("Only the walker can update the journey location");
        }

        // The Safe Walk must currently have status ACTIVE
        if (!"ACTIVE".equalsIgnoreCase(walk.getStatus())) {
            throw new BadRequestException("Cannot update location for a " + walk.getStatus().toLowerCase() + " Safe Walk");
        }

        Double lat = request.getLatitude();
        Double lng = request.getLongitude();
        if (lat == null || lat < -90.0 || lat > 90.0) {
            throw new BadRequestException("Latitude must be between -90 and 90");
        }
        if (lng == null || lng < -180.0 || lng > 180.0) {
            throw new BadRequestException("Longitude must be between -180 and 180");
        }

        safeWalkRepository.updateLocation(id, lat, lng);
        SafeWalk updated = safeWalkRepository.findById(id).orElse(walk);
        evaluateTimingState(updated);
        return ApiResponse.success("Location updated successfully", updated);
    }

    public ApiResponse<SafeWalk> extendSafeWalk(Long id, SafeWalkExtendRequest request, UserPrincipal principal) {
        SafeWalk walk = safeWalkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Safe Walk session not found"));

        // Only the walker who owns the Safe Walk can extend its duration
        if (!walk.getUserId().equals(principal.getId())) {
            throw new ForbiddenException("Only the walker can extend their Safe Walk session");
        }

        // Must currently have status ACTIVE
        if (!"ACTIVE".equalsIgnoreCase(walk.getStatus())) {
            throw new BadRequestException("Cannot extend a " + walk.getStatus().toLowerCase() + " Safe Walk session");
        }

        Integer extensionMinutes = request.getExtensionMinutes();
        if (extensionMinutes == null || extensionMinutes < 1 || extensionMinutes > 180) {
            throw new BadRequestException("Extension duration must be between 1 and 180 minutes");
        }

        Instant now = Instant.now();
        Instant currentArrival = parseInstant(walk.getExpectedArrival());
        // If expected arrival is in the past (e.g. GRACE or OVERDUE), extend from now as a deliberate recovery action
        Instant baseInstant = (currentArrival == null || currentArrival.isBefore(now)) ? now : currentArrival;
        Instant newArrival = baseInstant.plus(extensionMinutes, ChronoUnit.MINUTES);

        safeWalkRepository.extendJourney(id, newArrival.toString());

        SafeWalk updated = safeWalkRepository.findById(id).orElse(walk);
        evaluateTimingState(updated);
        return ApiResponse.success("Safe Walk journey extended by " + extensionMinutes + " minutes", updated);
    }

    public void evaluateTimingState(SafeWalk walk) {
        if (walk == null) return;

        walk.setGracePeriodMinutes(DEFAULT_GRACE_PERIOD_MINUTES);

        String status = walk.getStatus();
        if ("COMPLETED".equalsIgnoreCase(status)) {
            walk.setTimingStatus("COMPLETED");
            return;
        }
        if ("CANCELLED".equalsIgnoreCase(status)) {
            walk.setTimingStatus("CANCELLED");
            return;
        }

        if (!"ACTIVE".equalsIgnoreCase(status)) {
            walk.setTimingStatus(status != null ? status.toUpperCase() : "ACTIVE");
            return;
        }

        String arrivalStr = walk.getExpectedArrival();
        if (arrivalStr == null || arrivalStr.trim().isEmpty()) {
            walk.setTimingStatus("ACTIVE");
            return;
        }

        Instant expectedInstant = parseInstant(arrivalStr);
        if (expectedInstant == null) {
            walk.setTimingStatus("ACTIVE");
            return;
        }

        Instant graceUntil = expectedInstant.plus(DEFAULT_GRACE_PERIOD_MINUTES, ChronoUnit.MINUTES);
        walk.setGraceUntil(graceUntil.toString());

        Instant now = Instant.now();
        if (now.isBefore(expectedInstant)) {
            walk.setTimingStatus("ACTIVE");
        } else if (now.isBefore(graceUntil)) {
            walk.setTimingStatus("GRACE");
        } else {
            walk.setTimingStatus("OVERDUE");

            // Check and trigger idempotent companion overdue notification
            if (walk.getOverdueNotifiedAt() == null && walk.getId() != null) {
                int updatedRows = safeWalkRepository.markOverdueNotified(walk.getId());
                if (updatedRows > 0) {
                    walk.setOverdueNotifiedAt(now.toString());
                    try {
                        notificationRepository.insert(
                                walk.getCompanionId(),
                                null,
                                "Safe Walk overdue",
                                walk.getUserName() + "'s Safe Walk has passed the expected arrival time and has not been marked complete.",
                                "safe_walk_overdue"
                        );
                        log.info("Overdue notification created for companion {} (Safe Walk ID: {})", walk.getCompanionId(), walk.getId());
                    } catch (Exception e) {
                        log.warn("Failed to create overdue notification for Safe Walk {}: {}", walk.getId(), e.getMessage());
                    }
                }
            }
        }
    }

    private Instant parseInstant(String str) {
        if (str == null || str.trim().isEmpty()) return null;
        String s = str.trim();
        try {
            return Instant.parse(s);
        } catch (Exception e1) {
            try {
                if (s.contains(" ") && !s.contains("T")) {
                    s = s.replace(" ", "T");
                }
                if (!s.endsWith("Z") && !s.contains("+") && !s.contains("-", 10)) {
                    s = s + "Z";
                }
                return Instant.parse(s);
            } catch (Exception e2) {
                try {
                    return java.time.OffsetDateTime.parse(str.trim()).toInstant();
                } catch (Exception e3) {
                    log.warn("Could not parse datetime string: {}", str);
                    return null;
                }
            }
        }
    }
}


