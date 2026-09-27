package com.womensafety.service;

import com.womensafety.exception.BadRequestException;
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

@Service
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final FileStorageService fileStorageService;

    public PlaceService(PlaceRepository placeRepository, FileStorageService fileStorageService) {
        this.placeRepository = placeRepository;
        this.fileStorageService = fileStorageService;
    }

    public ApiResponse<List<Place>> getPlaces(String state, String district) {
        List<Place> places = placeRepository.findAllAccepted(state, district);
        ApiResponse<List<Place>> response = ApiResponse.success("Places retrieved successfully", places);
        response.setCount(places.size());
        return response;
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
                principal.getId()
        );

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", placeId);
        data.put("status", "pending");

        return ApiResponse.success("Hazardous place reported successfully. It is pending admin review.", data);
    }
}
