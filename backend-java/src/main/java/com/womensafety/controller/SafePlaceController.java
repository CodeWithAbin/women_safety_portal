package com.womensafety.controller;

import com.womensafety.model.SafePlace;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.CreateSafePlaceRequest;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.SafePlaceService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/safe-places")
public class SafePlaceController {

    private final SafePlaceService safePlaceService;

    public SafePlaceController(SafePlaceService safePlaceService) {
        this.safePlaceService = safePlaceService;
    }

    // 1. Browse approved safe places
    @GetMapping
    public ResponseEntity<ApiResponse<List<SafePlace>>> getAcceptedSafePlaces(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) String sort) {
        ApiResponse<List<SafePlace>> response = safePlaceService.getAcceptedSafePlaces(
                state, district, search, minRating, sort);
        return ResponseEntity.ok(response);
    }

    // 2. View user's own safe place submissions
    @GetMapping("/my-reports")
    public ResponseEntity<ApiResponse<List<SafePlace>>> getMySafePlaces(
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<List<SafePlace>> response = safePlaceService.getMySafePlaces(principal);
        return ResponseEntity.ok(response);
    }

    // 3. View approved safe place details
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SafePlace>> getSafePlaceById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<SafePlace> response = safePlaceService.getSafePlaceById(id, principal);
        return ResponseEntity.ok(response);
    }

    // 4. Submit a safe place (supports multipart/form-data and json)
    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<ApiResponse<SafePlace>> submitSafePlaceMultipart(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @ModelAttribute CreateSafePlaceRequest req,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {
        ApiResponse<SafePlace> response = safePlaceService.submitSafePlace(principal, req, photo);
        return ResponseEntity.ok(response);
    }

    @PostMapping(consumes = {MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<ApiResponse<SafePlace>> submitSafePlaceJson(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateSafePlaceRequest req) {
        ApiResponse<SafePlace> response = safePlaceService.submitSafePlace(principal, req, null);
        return ResponseEntity.ok(response);
    }
}
