package com.womensafety.controller;

import com.womensafety.model.CommunityMessage;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.CreateCommunityMessageRequest;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.CommunityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/community")
public class CommunityController {

    private final CommunityService communityService;

    public CommunityController(CommunityService communityService) {
        this.communityService = communityService;
    }

    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<List<CommunityMessage>>> getMessages() {
        ApiResponse<List<CommunityMessage>> response = communityService.getRecentMessages();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<CommunityMessage>> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCommunityMessageRequest request) {
        ApiResponse<CommunityMessage> response = communityService.sendMessage(principal, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/messages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<Void> response = communityService.deleteMessage(id, principal);
        return ResponseEntity.ok(response);
    }
}
