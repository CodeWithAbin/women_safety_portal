package com.womensafety.controller;

import com.womensafety.model.CompanionRelationship;
import com.womensafety.model.User;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.CompanionRequestDto;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.CompanionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companions")
public class CompanionController {

    private final CompanionService companionService;

    public CompanionController(CompanionService companionService) {
        this.companionService = companionService;
    }

    // 1. Send companion request
    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<CompanionRelationship>> sendRequest(
            @Valid @RequestBody CompanionRequestDto requestDto,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<CompanionRelationship> response = companionService.sendRequest(requestDto, principal);
        return ResponseEntity.ok(response);
    }

    // 2. Get pending companion requests
    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<List<CompanionRelationship>>> getPendingRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<List<CompanionRelationship>> response = companionService.getPendingRequests(principal);
        return ResponseEntity.ok(response);
    }

    // 3. Accept companion request
    @PatchMapping("/requests/{id}/accept")
    public ResponseEntity<ApiResponse<CompanionRelationship>> acceptRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<CompanionRelationship> response = companionService.acceptRequest(id, principal);
        return ResponseEntity.ok(response);
    }

    // 4. Reject companion request
    @PatchMapping("/requests/{id}/reject")
    public ResponseEntity<ApiResponse<CompanionRelationship>> rejectRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<CompanionRelationship> response = companionService.rejectRequest(id, principal);
        return ResponseEntity.ok(response);
    }

    // 5. Get all accepted companions
    @GetMapping
    public ResponseEntity<ApiResponse<List<CompanionRelationship>>> getAcceptedCompanions(
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<List<CompanionRelationship>> response = companionService.getAcceptedCompanions(principal);
        return ResponseEntity.ok(response);
    }

    // 6. Remove companion relationship
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> removeCompanion(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<Void> response = companionService.removeCompanion(id, principal);
        return ResponseEntity.ok(response);
    }

    // 7. Search registered users to add as companions
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<User>>> searchUsers(
            @RequestParam(required = false, defaultValue = "") String query,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<List<User>> response = companionService.searchUsers(query, principal);
        return ResponseEntity.ok(response);
    }
}
