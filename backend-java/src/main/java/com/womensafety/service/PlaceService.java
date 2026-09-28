package com.womensafety.service;

import com.womensafety.exception.BadRequestException;
import com.womensafety.exception.ResourceNotFoundException;
import com.womensafety.model.Place;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.PlaceReportRequest;
import com.womensafety.repository.PlaceRepository;
import com.womensafety.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final FileStorageService fileStorageService;

    public PlaceService(PlaceRepository placeRepository, FileStorageService fileStorageService) {
        this.placeRepository = placeRepository;
        this.fileStorageService = fileStorageService;
    }

    public ApiResponse<List<Place>> getPlaces(String state, String district, String search, Integer minRating, String sort, UserPrincipal principal) {
        if (minRating != null && (minRating < 1 || minRating > 5)) {
            throw new BadRequestException("minRating must be an integer between 1 and 5.");
        }

        if (sort != null && !sort.trim().isEmpty()) {
            String normalizedSort = sort.trim().toLowerCase();
            if (!normalizedSort.equals("rating_desc") && !normalizedSort.equals("rating_asc") && !normalizedSort.equals("newest")) {
                throw new BadRequestException("Invalid sort parameter. Supported values: rating_desc, rating_asc, newest");
            }
        }

        Long userId = principal != null ? principal.getId() : null;
        List<Place> places = placeRepository.findAllAccepted(state, district, search, minRating, sort, userId);
        ApiResponse<List<Place>> response = ApiResponse.success("Places retrieved successfully", places);
        response.setCount(places.size());
        return response;
    }

    public ApiResponse<Map<String, Object>> supportPlace(Long placeId, UserPrincipal principal) {
        if (placeId == null) {
            throw new BadRequestException("Place ID is required.");
        }
        if (principal == null) {
            throw new BadRequestException("Authentication is required to support a report.");
        }

        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id " + placeId));

        placeRepository.addSupport(place.getId(), principal.getId());
        int newCount = placeRepository.getSupportCount(place.getId());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("report_id", place.getId());
        data.put("support_count", newCount);
        data.put("has_supported", true);

        return ApiResponse.success("You supported this community report.", data);
    }

    public ApiResponse<Map<String, Object>> checkSimilar(String state, String district, String address, String name, UserPrincipal principal) {
        Optional<Place> similarOpt = placeRepository.findSimilarAcceptedReport(state, district, address, name);

        Map<String, Object> data = new LinkedHashMap<>();
        if (similarOpt.isPresent()) {
            Place similar = similarOpt.get();
            if (principal != null) {
                similar.setHasSupported(placeRepository.hasUserSupported(similar.getId(), principal.getId()));
            }
            data.put("similar_found", true);
            data.put("existing_report", similar);
            return ApiResponse.success("Similar report found at this location", data);
        } else {
            data.put("similar_found", false);
            data.put("existing_report", null);
            return ApiResponse.success("No similar report found", data);
        }
    }

    public ApiResponse<Map<String, Object>> reportPlace(PlaceReportRequest req, MultipartFile photo, UserPrincipal principal) {
        if (req.getName() == null || req.getName().trim().isEmpty() ||
            req.getAddress() == null || req.getAddress().trim().isEmpty() ||
            req.getState() == null || req.getState().trim().isEmpty() ||
            req.getDistrict() == null || req.getDistrict().trim().isEmpty() ||
            req.getRating() == null || req.getRating().trim().isEmpty() ||
            req.getDescription() == null || req.getDescription().trim().isEmpty()) {
            throw new BadRequestException("Missing required fields: name, address, state, district, rating, description");
        }

        if (photo == null || photo.isEmpty()) {
            throw new BadRequestException("A photo of the hazardous place is required.");
        }

        int ratingVal;
        try {
            ratingVal = Integer.parseInt(req.getRating().trim());
            if (ratingVal < 1 || ratingVal > 5) {
                throw new BadRequestException("Rating must be an integer between 1 and 5.");
            }
        } catch (NumberFormatException e) {
            throw new BadRequestException("Rating must be an integer between 1 and 5.");
        }

        String photoUrl = fileStorageService.store(photo);

        Long placeId = placeRepository.insertReport(
                req.getName().trim(),
                req.getAddress().trim(),
                req.getState().trim(),
                req.getDistrict().trim(),
                photoUrl,
                ratingVal,
                req.getDescription().trim(),
                principal != null ? principal.getId() : null
        );

        if (principal != null && placeId != null) {
            placeRepository.addSupport(placeId, principal.getId());
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", placeId);
        data.put("status", "pending");

        return ApiResponse.success("Your report has been submitted and is waiting for admin review.", data);
    }
}
