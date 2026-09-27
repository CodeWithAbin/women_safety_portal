package com.womensafety.controller;

import com.womensafety.model.Place;
import com.womensafety.model.dto.ApiResponse;
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

    // 4. Browse accepted hazardous places filtered by State & District (Authenticated)
    @GetMapping
    public ResponseEntity<ApiResponse<List<Place>>> getPlaces(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district) {
        ApiResponse<List<Place>> response = placeService.getPlaces(state, district);
        return ResponseEntity.ok(response);
    }

    // 5. Submit a place report for review with photo upload (Authenticated)
    @PostMapping(value = "/report", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportPlace(
            @ModelAttribute PlaceReportRequest req,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<Map<String, Object>> response = placeService.reportPlace(req, photo, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
