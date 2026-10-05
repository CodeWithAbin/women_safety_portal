package com.womensafety.controller;

import com.womensafety.model.SafePlace;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.SafePlaceStatusUpdateRequest;
import com.womensafety.service.SafePlaceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/safe-places")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSafePlaceController {

    private final SafePlaceService safePlaceService;

    public AdminSafePlaceController(SafePlaceService safePlaceService) {
        this.safePlaceService = safePlaceService;
    }

    // 1. View all safe places for moderation
    @GetMapping
    public ResponseEntity<ApiResponse<List<SafePlace>>> getAdminSafePlaces(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String search) {
        ApiResponse<List<SafePlace>> response = safePlaceService.getAdminSafePlaces(status, state, district, search);
        return ResponseEntity.ok(response);
    }

    // 2. Summary counts for Admin Dashboard
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getSafePlacesSummary() {
        ApiResponse<Map<String, Integer>> response = safePlaceService.getAdminSummary();
        return ResponseEntity.ok(response);
    }

    // 3. Update status (approve or reject)
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody SafePlaceStatusUpdateRequest req) {
        ApiResponse<Void> response = safePlaceService.updateSafePlaceStatus(id, req.getStatus());
        return ResponseEntity.ok(response);
    }

    // 4. Delete safe place
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSafePlace(@PathVariable Long id) {
        ApiResponse<Void> response = safePlaceService.deleteSafePlace(id);
        return ResponseEntity.ok(response);
    }
}
