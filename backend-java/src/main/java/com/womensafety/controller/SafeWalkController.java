package com.womensafety.controller;

import com.womensafety.model.SafeWalk;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.LocationUpdateRequest;
import com.womensafety.model.dto.SafeWalkCreateRequest;
import com.womensafety.model.dto.SafeWalkExtendRequest;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.SafeWalkService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/safe-walks")
public class SafeWalkController {

    private final SafeWalkService safeWalkService;

    public SafeWalkController(SafeWalkService safeWalkService) {
        this.safeWalkService = safeWalkService;
    }

    // 1. Start a new Safe Walk journey
    @PostMapping
    public ResponseEntity<ApiResponse<SafeWalk>> createSafeWalk(
            @Valid @RequestBody SafeWalkCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<SafeWalk> response = safeWalkService.createSafeWalk(request, principal);
        return ResponseEntity.ok(response);
    }

    // 2. Get the active Safe Walk session for current user (as walker or companion)
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<SafeWalk>> getActiveSafeWalk(
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<SafeWalk> response = safeWalkService.getActiveSafeWalk(principal);
        return ResponseEntity.ok(response);
    }

    // 3. Get Safe Walk by ID (restricted to walker or selected companion)
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SafeWalk>> getSafeWalkById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<SafeWalk> response = safeWalkService.getSafeWalkById(id, principal);
        return ResponseEntity.ok(response);
    }

    // 4. Mark Safe Walk as completed (walker only)
    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<SafeWalk>> completeSafeWalk(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<SafeWalk> response = safeWalkService.completeSafeWalk(id, principal);
        return ResponseEntity.ok(response);
    }

    // 5. Cancel Safe Walk (walker only)
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<SafeWalk>> cancelSafeWalk(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<SafeWalk> response = safeWalkService.cancelSafeWalk(id, principal);
        return ResponseEntity.ok(response);
    }

    // 6. Update current live location (walker only)
    @PatchMapping("/{id}/location")
    public ResponseEntity<ApiResponse<SafeWalk>> updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody LocationUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<SafeWalk> response = safeWalkService.updateLocation(id, request, principal);
        return ResponseEntity.ok(response);
    }

    // 7. Extend active Safe Walk journey duration (walker only)
    @PatchMapping("/{id}/extend")
    public ResponseEntity<ApiResponse<SafeWalk>> extendSafeWalk(
            @PathVariable Long id,
            @Valid @RequestBody SafeWalkExtendRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<SafeWalk> response = safeWalkService.extendSafeWalk(id, request, principal);
        return ResponseEntity.ok(response);
    }
}
