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
        return getPlaces(state, district, search, minRating, sort, null, null, null, principal);
    }

    public ApiResponse<List<Place>> getPlaces(String state, String district, String search, Integer minRating, String sort, Double latitude, Double longitude, Double radiusKm, UserPrincipal principal) {
        if (minRating != null && (minRating < 1 || minRating > 5)) {
            throw new BadRequestException("minRating must be an integer between 1 and 5.");
        }

        if (sort != null && !sort.trim().isEmpty()) {
            String normalizedSort = sort.trim().toLowerCase();
            if (!normalizedSort.equals("rating_desc") && !normalizedSort.equals("rating_asc") && !normalizedSort.equals("newest")) {
                throw new BadRequestException("Invalid sort parameter. Supported values: rating_desc, rating_asc, newest");
            }
        }

        if (latitude != null || longitude != null || radiusKm != null) {
            if (latitude == null || longitude == null || radiusKm == null) {
                throw new BadRequestException("latitude, longitude, and radiusKm are all required for nearby place discovery.");
            }
            if (latitude < -90.0 || latitude > 90.0) {
                throw new BadRequestException("Latitude must be between -90 and 90 degrees.");
            }
            if (longitude < -180.0 || longitude > 180.0) {
                throw new BadRequestException("Longitude must be between -180 and 180 degrees.");
            }
            if (radiusKm <= 0.0 || radiusKm > 100.0) {
                throw new BadRequestException("radiusKm must be a positive number up to 100 km.");
            }
        }

        Long userId = principal != null ? principal.getId() : null;
        List<Place> places = placeRepository.findAllAccepted(state, district, search, minRating, sort, userId, latitude, longitude, radiusKm);
        ApiResponse<List<Place>> response = ApiResponse.success("Places retrieved successfully", places);
        response.setCount(places.size());
        return response;
    }

    public ApiResponse<Map<String, Object>> ratePlace(Long placeId, Integer rating, UserPrincipal principal) {
        if (placeId == null) {
            throw new BadRequestException("Place ID is required.");
        }
        if (principal == null) {
            throw new BadRequestException("Authentication is required to rate a place.");
        }
        if (rating == null || rating < 1 || rating > 5) {
            throw new BadRequestException("Rating must be an integer between 1 and 5.");
        }

        Place place = placeRepository.findById(placeId, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id " + placeId));

        placeRepository.upsertRating(place.getId(), principal.getId(), rating);

        double updatedCommunityRating = placeRepository.getCommunityRating(place.getId());
        int updatedRatingCount = placeRepository.getRatingCount(place.getId());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("place_id", place.getId());
        data.put("community_rating", updatedCommunityRating);
        data.put("rating_count", updatedRatingCount);
        data.put("user_rating", rating);
        data.put("has_rated", true);

        return ApiResponse.success("Your rating has been saved successfully.", data);
    }

    public ApiResponse<Map<String, Object>> checkSimilar(String state, String district, String address, String name, UserPrincipal principal) {
        Optional<Place> similarOpt = placeRepository.findSimilarAcceptedReport(state, district, address, name);

        Map<String, Object> data = new LinkedHashMap<>();
        if (similarOpt.isPresent()) {
            Place similar = similarOpt.get();
            if (principal != null) {
                placeRepository.getUserRating(similar.getId(), principal.getId())
                        .ifPresent(r -> {
                            similar.setUserRating(r);
                            similar.setHasRated(true);
                        });
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

        Double lat = req.getLatitude();
        Double lon = req.getLongitude();
        if (lat == null || lon == null) {
            throw new BadRequestException("Report location is required. Valid latitude and longitude coordinates must be provided.");
        }
        if (lat < -90.0 || lat > 90.0) {
            throw new BadRequestException("Latitude must be between -90 and 90 degrees.");
        }
        if (lon < -180.0 || lon > 180.0) {
            throw new BadRequestException("Longitude must be between -180 and 180 degrees.");
        }

        String photoUrl = fileStorageService.store(photo);

        Long placeId = placeRepository.insertReport(
                req.getName().trim(),
                req.getAddress().trim(),
                req.getState().trim(),
                req.getDistrict().trim(),
                lat,
                lon,
                photoUrl,
                ratingVal,
                req.getDescription().trim(),
                principal != null ? principal.getId() : null
        );

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", placeId);
        data.put("status", "pending");

        return ApiResponse.success("Your report has been submitted and is waiting for admin review.", data);
    }

    public ApiResponse<List<Place>> getMyReports(UserPrincipal principal) {
        if (principal == null) {
            throw new BadRequestException("Authentication is required to view your reports.");
        }
        List<Place> reports = placeRepository.findReportsBySubmittedBy(principal.getId());
        ApiResponse<List<Place>> response = ApiResponse.success("Your submitted reports retrieved successfully", reports);
        response.setCount(reports.size());
        return response;
    }

    public ApiResponse<Place> getPlaceById(Long id, UserPrincipal principal) {
        if (id == null) {
            throw new BadRequestException("Place ID is required.");
        }
        Long userId = principal != null ? principal.getId() : null;
        Place place = placeRepository.findById(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Reported place not found with id " + id));

        // If not accepted, only the submitter or admin can view it
        if (!"accepted".equalsIgnoreCase(place.getStatus())) {
            boolean isSubmitter = userId != null && userId.equals(place.getSubmittedBy());
            boolean isAdmin = principal != null && "ROLE_ADMIN".equals(principal.getRole());
            if (!isSubmitter && !isAdmin) {
                throw new ResourceNotFoundException("Reported place not found with id " + id);
            }
        }

        // Ensure private reporter information is not exposed to non-admins
        if (principal == null || !"ROLE_ADMIN".equals(principal.getRole())) {
            place.setReporterEmail(null);
            place.setReporterPhone(null);
        }

        return ApiResponse.success("Place details retrieved successfully", place);
    }
}
