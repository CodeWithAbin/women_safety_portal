package com.womensafety.service;

import com.womensafety.exception.BadRequestException;
import com.womensafety.exception.ForbiddenException;
import com.womensafety.exception.ResourceNotFoundException;
import com.womensafety.model.Place;
import com.womensafety.model.User;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.PlaceAdminRequest;
import com.womensafety.model.dto.UserUpdateRequest;
import com.womensafety.repository.PlaceRepository;
import com.womensafety.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class AdminService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\s@]+@[^\s@]+\\.[^\s@]+$");

    private final PlaceRepository placeRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Value("${app.admin.email:admin@gmail.com}")
    private String adminEmail;

    public AdminService(PlaceRepository placeRepository, UserRepository userRepository, FileStorageService fileStorageService) {
        this.placeRepository = placeRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    public ApiResponse<List<Place>> getReports(String status) {
        List<Place> reports = placeRepository.findReports(status);
        ApiResponse<List<Place>> response = ApiResponse.success("Reports retrieved successfully", reports);
        response.setCount(reports.size());
        return response;
    }

    public ApiResponse<Void> updateReportStatus(Long reportId, String status) {
        if (status == null || (!status.trim().equalsIgnoreCase("accepted") && !status.trim().equalsIgnoreCase("rejected"))) {
            throw new BadRequestException("Status must be either 'accepted' or 'rejected'.");
        }

        String normalizedStatus = status.trim().toLowerCase();

        Place place = placeRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Reported place not found."));

        placeRepository.updateStatusWithNotification(reportId, normalizedStatus, place);

        return ApiResponse.success("Report status successfully updated to '" + normalizedStatus + "'.");
    }

    public ApiResponse<List<Place>> getPlaces(String state, String district) {
        return getPlaces(state, district, null, null, null);
    }

    public ApiResponse<List<Place>> getPlaces(String state, String district, String search, Integer minRating, String sort) {
        if (minRating != null && (minRating < 1 || minRating > 5)) {
            throw new BadRequestException("minRating must be an integer between 1 and 5.");
        }

        if (sort != null && !sort.trim().isEmpty()) {
            String normalizedSort = sort.trim().toLowerCase();
            if (!normalizedSort.equals("rating_desc") && !normalizedSort.equals("rating_asc") && !normalizedSort.equals("newest")) {
                throw new BadRequestException("Invalid sort parameter. Supported values: rating_desc, rating_asc, newest");
            }
        }

        List<Place> places = placeRepository.findAdminPlaces(state, district, search, minRating, sort);
        ApiResponse<List<Place>> response = ApiResponse.success("Places retrieved successfully", places);
        response.setCount(places.size());
        return response;
    }

    public ApiResponse<Place> createPlace(PlaceAdminRequest req, MultipartFile photo) {
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

        Long placeId = placeRepository.insertAdminPlace(
                req.getName().trim(),
                req.getAddress().trim(),
                req.getState().trim(),
                req.getDistrict().trim(),
                photoUrl,
                ratingVal,
                req.getDescription().trim()
        );

        Place newPlace = placeRepository.findById(placeId)
                .orElseThrow(() -> new RuntimeException("Failed to retrieve created place."));

        return ApiResponse.success("Hazardous place created and published successfully.", newPlace);
    }

    public ApiResponse<Place> updatePlace(Long placeId, PlaceAdminRequest req, MultipartFile photo) {
        Place existingPlace = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found."));

        if (req.getName() == null || req.getName().trim().isEmpty() ||
            req.getAddress() == null || req.getAddress().trim().isEmpty() ||
            req.getState() == null || req.getState().trim().isEmpty() ||
            req.getDistrict() == null || req.getDistrict().trim().isEmpty() ||
            req.getRating() == null || req.getRating().trim().isEmpty() ||
            req.getDescription() == null || req.getDescription().trim().isEmpty()) {
            throw new BadRequestException("Missing required fields: name, address, state, district, rating, description");
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

        String photoUrl = (photo != null && !photo.isEmpty())
                ? fileStorageService.store(photo)
                : existingPlace.getPhoto();

        placeRepository.update(
                placeId,
                req.getName().trim(),
                req.getAddress().trim(),
                req.getState().trim(),
                req.getDistrict().trim(),
                photoUrl,
                ratingVal,
                req.getDescription().trim()
        );

        Place updatedPlace = placeRepository.findById(placeId)
                .orElseThrow(() -> new RuntimeException("Failed to retrieve updated place."));

        return ApiResponse.success("Hazardous place updated successfully.", updatedPlace);
    }

    public ApiResponse<Void> deletePlace(Long placeId) {
        placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found."));

        placeRepository.delete(placeId);
        return ApiResponse.success("Hazardous place deleted successfully.");
    }

    public ApiResponse<List<User>> getUsers(String state, String district) {
        List<User> users = userRepository.findAll(state, district);
        ApiResponse<List<User>> response = ApiResponse.success("Users retrieved successfully", users);
        response.setCount(users.size());
        return response;
    }

    public ApiResponse<User> updateUser(Long userId, UserUpdateRequest req) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (req.getName() == null || req.getName().trim().isEmpty() ||
            req.getEmail() == null || req.getEmail().trim().isEmpty() ||
            req.getState() == null || req.getState().trim().isEmpty() ||
            req.getDistrict() == null || req.getDistrict().trim().isEmpty()) {
            throw new BadRequestException("Missing required fields: name, email, state, district");
        }

        String normalizedEmail = req.getEmail().trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            throw new BadRequestException("Please provide a valid email address.");
        }

        if (userRepository.existsByEmailAndIdNot(normalizedEmail, userId)) {
            throw new BadRequestException("An account with this email already exists.");
        }

        userRepository.update(
                userId,
                req.getName().trim(),
                normalizedEmail,
                req.getState().trim(),
                req.getDistrict().trim(),
                req.getPhone() != null ? req.getPhone().trim() : null
        );

        User updatedUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Failed to retrieve updated user."));

        return ApiResponse.success("User updated successfully.", updatedUser);
    }

    public ApiResponse<Void> deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if ("admin".equalsIgnoreCase(user.getRole()) ||
            (adminEmail != null && user.getEmail().equalsIgnoreCase(adminEmail.trim()))) {
            throw new ForbiddenException("Access forbidden. The administrator account cannot be deleted.");
        }

        userRepository.deleteCascade(userId);
        return ApiResponse.success("User deleted successfully. Historical submitted places preserved.");
    }
}
