package com.womensafety.controller;

import com.womensafety.model.Place;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.PlaceRateRequest;
import com.womensafety.model.dto.PlaceReportRequest;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.PlaceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
    }

    // Browse accepted hazardous places filtered by State, District, Search, MinRating & Sort (Authenticated/Public)
    @GetMapping
    public ResponseEntity<ApiResponse<List<Place>>> getPlaces(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) String sort,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<List<Place>> response = placeService.getPlaces(state, district, search, minRating, sort, principal);
        return ResponseEntity.ok(response);
    }

    // Check if similar accepted report already exists for a location + problem statement
    @GetMapping("/check-similar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkSimilar(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String name,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<Map<String, Object>> response = placeService.checkSimilar(state, district, address, name, principal);
        return ResponseEntity.ok(response);
    }

    // Rate a place (Community Safety Rating: 1-5 stars)
    @PostMapping("/{id}/rate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ratePlace(
            @PathVariable Long id,
            @RequestBody PlaceRateRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<Map<String, Object>> response = placeService.ratePlace(
                id,
                req != null ? req.getRating() : null,
                principal
        );
        return ResponseEntity.ok(response);
    }

    // Submit a place report for review with photo upload (Authenticated)
    @PostMapping(value = "/report", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportPlace(
            @ModelAttribute PlaceReportRequest req,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<Map<String, Object>> response = placeService.reportPlace(req, photo, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
