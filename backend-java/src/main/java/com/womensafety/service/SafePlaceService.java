package com.womensafety.service;

import com.womensafety.exception.BadRequestException;
import com.womensafety.exception.ResourceNotFoundException;
import com.womensafety.model.SafePlace;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.CreateSafePlaceRequest;
import com.womensafety.repository.NotificationRepository;
import com.womensafety.repository.SafePlaceRepository;
import com.womensafety.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SafePlaceService {

    private final SafePlaceRepository safePlaceRepository;
    private final NotificationRepository notificationRepository;
    private final FileStorageService fileStorageService;

    public SafePlaceService(
            SafePlaceRepository safePlaceRepository,
            NotificationRepository notificationRepository,
            FileStorageService fileStorageService) {
        this.safePlaceRepository = safePlaceRepository;
        this.notificationRepository = notificationRepository;
        this.fileStorageService = fileStorageService;
    }

    public ApiResponse<List<SafePlace>> getAcceptedSafePlaces(
            String state, String district, String search, Integer minRating, String sort) {
        List<SafePlace> places = safePlaceRepository.findAllAccepted(state, district, search, minRating, sort);
        ApiResponse<List<SafePlace>> response = ApiResponse.success("Approved safe places retrieved", places);
        response.setCount(places.size());
        return response;
    }

    public ApiResponse<SafePlace> getSafePlaceById(Long id, UserPrincipal principal) {
        SafePlace place = safePlaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Safe place not found"));

        boolean isAdmin = principal != null && "admin".equalsIgnoreCase(principal.getRole());
        boolean isSubmitter = principal != null && place.getSubmittedBy() != null && place.getSubmittedBy().equals(principal.getId());

        if (!"accepted".equalsIgnoreCase(place.getStatus()) && !isAdmin && !isSubmitter) {
            throw new ResourceNotFoundException("Safe place not found or awaiting moderation approval");
        }

        return ApiResponse.success("Safe place details retrieved", place);
    }

    public ApiResponse<List<SafePlace>> getMySafePlaces(UserPrincipal principal) {
        if (principal == null || principal.getId() == null) {
            throw new BadRequestException("Authentication required");
        }
        List<SafePlace> places = safePlaceRepository.findReportsBySubmittedBy(principal.getId());
        ApiResponse<List<SafePlace>> response = ApiResponse.success("User safe-place submissions retrieved", places);
        response.setCount(places.size());
        return response;
    }

    public ApiResponse<SafePlace> submitSafePlace(
            UserPrincipal principal, CreateSafePlaceRequest req, MultipartFile photo) {
        if (principal == null || principal.getId() == null) {
            throw new BadRequestException("Authentication required to submit safe places");
        }

        SafePlace sp = new SafePlace();
        sp.setName(req.getName().trim());
        sp.setAddress(req.getAddress().trim());
        sp.setState(req.getState().trim());
        sp.setDistrict(req.getDistrict().trim());
        sp.setDescription(req.getDescription().trim());
        sp.setRating(req.getRating() != null ? req.getRating() : 5);
        sp.setLatitude(req.getLatitude());
        sp.setLongitude(req.getLongitude());
        sp.setSubmittedBy(principal.getId());
        sp.setStatus("pending");

        if (photo != null && !photo.isEmpty()) {
            try {
                String photoPath = fileStorageService.store(photo);
                sp.setPhoto(photoPath);
            } catch (Exception e) {
                // If optional photo fails, proceed with null/empty
                sp.setPhoto(null);
            }
        }

        Long newId = safePlaceRepository.insert(sp);
        SafePlace created = safePlaceRepository.findById(newId)
                .orElseThrow(() -> new RuntimeException("Failed to retrieve created safe place"));

        return ApiResponse.success("Safe place submitted successfully for verification", created);
    }

    // ==========================================
    // Admin Moderation Methods
    // ==========================================

    public ApiResponse<List<SafePlace>> getAdminSafePlaces(String status, String state, String district, String search) {
        List<SafePlace> places = safePlaceRepository.findAllForAdmin(status, state, district, search);
        ApiResponse<List<SafePlace>> response = ApiResponse.success("Safe places retrieved for moderation", places);
        response.setCount(places.size());
        return response;
    }

    public ApiResponse<Void> updateSafePlaceStatus(Long id, String status) {
        String normalizedStatus = status != null ? status.trim().toLowerCase() : "";
        if (!"accepted".equals(normalizedStatus) && !"rejected".equals(normalizedStatus)) {
            throw new BadRequestException("Status must be either 'accepted' or 'rejected'");
        }

        SafePlace place = safePlaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Safe place not found"));

        safePlaceRepository.updateStatus(id, normalizedStatus);

        // Notify submitter if known
        if (place.getSubmittedBy() != null) {
            try {
                String placeName = place.getName() != null ? place.getName() : "Safe Place";
                if ("accepted".equals(normalizedStatus)) {
                    notificationRepository.insert(
                            place.getSubmittedBy(),
                            null,
                            "Safe Place Approved",
                            "Your safe-place submission '" + placeName + "' was approved and is now live on the map.",
                            "safe_place_accepted"
                    );
                } else {
                    notificationRepository.insert(
                            place.getSubmittedBy(),
                            null,
                            "Safe Place Review Update",
                            "Your safe-place submission '" + placeName + "' was reviewed and rejected.",
                            "safe_place_rejected"
                    );
                }
            } catch (Exception ignored) {
                // Notification failure should not block moderation
            }
        }

        return ApiResponse.success("Safe place status updated to " + normalizedStatus);
    }

    public ApiResponse<Void> deleteSafePlace(Long id) {
        SafePlace place = safePlaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Safe place not found"));
        safePlaceRepository.delete(id);
        return ApiResponse.success("Safe place deleted successfully");
    }

    public ApiResponse<Map<String, Integer>> getAdminSummary() {
        int pending = safePlaceRepository.countByStatus("pending");
        int accepted = safePlaceRepository.countByStatus("accepted");
        int rejected = safePlaceRepository.countByStatus("rejected");

        Map<String, Integer> summary = new HashMap<>();
        summary.put("pending", pending);
        summary.put("accepted", accepted);
        summary.put("rejected", rejected);
        summary.put("total", pending + accepted + rejected);

        return ApiResponse.success("Safe places summary retrieved", summary);
    }
}
