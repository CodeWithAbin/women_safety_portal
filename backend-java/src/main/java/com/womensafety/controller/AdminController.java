package com.womensafety.controller;

import com.womensafety.model.Place;
import com.womensafety.model.User;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.PlaceAdminRequest;
import com.womensafety.model.dto.StatusUpdateRequest;
import com.womensafety.model.dto.UserUpdateRequest;
import com.womensafety.service.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // 8. View user reports (supports optional ?status=pending)
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<Place>>> getReports(@RequestParam(required = false) String status) {
        ApiResponse<List<Place>> response = adminService.getReports(status);
        return ResponseEntity.ok(response);
    }

    // 9. Accept or reject user report
    @PatchMapping("/reports/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateReportStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest req) {
        ApiResponse<Void> response = adminService.updateReportStatus(id, req.getStatus());
        return ResponseEntity.ok(response);
    }

    // 10. View all hazardous places (with State, District, Search, MinRating & Sort filter)
    @GetMapping("/places")
    public ResponseEntity<ApiResponse<List<Place>>> getPlaces(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) String sort) {
        ApiResponse<List<Place>> response = adminService.getPlaces(state, district, search, minRating, sort);
        return ResponseEntity.ok(response);
    }

    // 11. Directly create an accepted hazardous place
    @PostMapping(value = "/places", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<ApiResponse<Place>> createPlace(
            @ModelAttribute PlaceAdminRequest req,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {
        ApiResponse<Place> response = adminService.createPlace(req, photo);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 12. Update hazardous place
    @PutMapping(value = "/places/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<ApiResponse<Place>> updatePlaceMultipart(
            @PathVariable Long id,
            @ModelAttribute PlaceAdminRequest req,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {
        ApiResponse<Place> response = adminService.updatePlace(id, req, photo);
        return ResponseEntity.ok(response);
    }

    @PutMapping(value = "/places/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Place>> updatePlaceJson(
            @PathVariable Long id,
            @RequestBody PlaceAdminRequest req) {
        ApiResponse<Place> response = adminService.updatePlace(id, req, null);
        return ResponseEntity.ok(response);
    }

    // 13. Delete hazardous place
    @DeleteMapping("/places/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlace(@PathVariable Long id) {
        ApiResponse<Void> response = adminService.deletePlace(id);
        return ResponseEntity.ok(response);
    }

    // 13B. Mark hazardous place as resolved
    @PatchMapping("/places/{id}/resolve")
    public ResponseEntity<ApiResponse<Place>> resolvePlace(@PathVariable Long id) {
        ApiResponse<Place> response = adminService.resolvePlace(id);
        return ResponseEntity.ok(response);
    }

    // 14. View registered users (with State & District filter)
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getUsers(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district) {
        ApiResponse<List<User>> response = adminService.getUsers(state, district);
        return ResponseEntity.ok(response);
    }

    // 15. Update user profile
    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable Long id,
            @RequestBody UserUpdateRequest req) {
        ApiResponse<User> response = adminService.updateUser(id, req);
        return ResponseEntity.ok(response);
    }

    // 16. Delete user account (Admin account protected, places preserved with submitted_by = NULL)
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        ApiResponse<Void> response = adminService.deleteUser(id);
        return ResponseEntity.ok(response);
    }
}
