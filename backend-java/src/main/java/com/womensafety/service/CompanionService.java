package com.womensafety.service;

import com.womensafety.exception.BadRequestException;
import com.womensafety.exception.ForbiddenException;
import com.womensafety.exception.ResourceNotFoundException;
import com.womensafety.model.CompanionRelationship;
import com.womensafety.model.User;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.CompanionRequestDto;
import com.womensafety.repository.CompanionRepository;
import com.womensafety.repository.NotificationRepository;
import com.womensafety.repository.UserRepository;
import com.womensafety.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CompanionService {

    private static final Logger log = LoggerFactory.getLogger(CompanionService.class);

    private final CompanionRepository companionRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public CompanionService(
            CompanionRepository companionRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository) {
        this.companionRepository = companionRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    public ApiResponse<CompanionRelationship> sendRequest(CompanionRequestDto requestDto, UserPrincipal principal) {
        Long requesterId = principal.getId();
        User recipient = null;

        if (requestDto.getRecipientId() != null) {
            recipient = userRepository.findById(requestDto.getRecipientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient user not found"));
        } else if (requestDto.getRecipientEmail() != null && !requestDto.getRecipientEmail().trim().isEmpty()) {
            recipient = userRepository.findByEmail(requestDto.getRecipientEmail().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("User with specified email not found"));
        } else {
            throw new BadRequestException("Recipient ID or email is required");
        }

        Long recipientId = recipient.getId();

        // 1. Prevent self-companion requests
        if (requesterId.equals(recipientId)) {
            throw new BadRequestException("You cannot send a companion request to yourself");
        }

        // 2. Check existing relationship
        Optional<CompanionRelationship> existingOpt = companionRepository.findBetweenUsers(requesterId, recipientId);

        if (existingOpt.isPresent()) {
            CompanionRelationship existing = existingOpt.get();
            if ("ACCEPTED".equalsIgnoreCase(existing.getStatus())) {
                throw new BadRequestException("You are already companions with " + recipient.getName());
            }

            if ("PENDING".equalsIgnoreCase(existing.getStatus())) {
                if (existing.getRequesterId().equals(requesterId)) {
                    throw new BadRequestException("A pending companion request has already been sent to this user");
                } else {
                    throw new BadRequestException(recipient.getName() + " has already sent you a request. Please accept their request instead");
                }
            }

            // If REJECTED, re-activate as PENDING from current requester
            companionRepository.delete(existing.getId());
        }

        Long id = companionRepository.insert(requesterId, recipientId, "PENDING");
        CompanionRelationship created = companionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Failed to retrieve created companion request"));

        // Send a notification to recipient
        try {
            notificationRepository.insert(
                    recipientId,
                    null,
                    "New Companion Request",
                    principal.getName() + " has sent you a Safe Walk companion request.",
                    "companion_request"
            );
        } catch (Exception e) {
            log.warn("Failed to create in-app notification for companion request: {}", e.getMessage());
        }

        return ApiResponse.success("Companion request sent successfully to " + recipient.getName(), created);
    }

    public ApiResponse<List<CompanionRelationship>> getPendingRequests(UserPrincipal principal) {
        List<CompanionRelationship> list = companionRepository.findPendingReceivedRequests(principal.getId());
        ApiResponse<List<CompanionRelationship>> response = ApiResponse.success("Pending requests retrieved successfully", list);
        response.setCount(list.size());
        return response;
    }

    public ApiResponse<CompanionRelationship> acceptRequest(Long relationshipId, UserPrincipal principal) {
        CompanionRelationship relationship = companionRepository.findById(relationshipId)
                .orElseThrow(() -> new ResourceNotFoundException("Companion request not found"));

        if (!relationship.getRecipientId().equals(principal.getId())) {
            throw new ForbiddenException("You are not authorized to accept this companion request");
        }

        if ("ACCEPTED".equalsIgnoreCase(relationship.getStatus())) {
            return ApiResponse.success("Companion request is already accepted", relationship);
        }

        companionRepository.updateStatus(relationshipId, "ACCEPTED");
        relationship.setStatus("ACCEPTED");

        // Send notification to requester
        try {
            notificationRepository.insert(
                    relationship.getRequesterId(),
                    null,
                    "Companion Request Accepted",
                    principal.getName() + " accepted your Safe Walk companion request.",
                    "companion_accepted"
            );
        } catch (Exception e) {
            log.warn("Failed to notify requester of accepted companion request: {}", e.getMessage());
        }

        return ApiResponse.success("Companion request accepted successfully", relationship);
    }

    public ApiResponse<CompanionRelationship> rejectRequest(Long relationshipId, UserPrincipal principal) {
        CompanionRelationship relationship = companionRepository.findById(relationshipId)
                .orElseThrow(() -> new ResourceNotFoundException("Companion request not found"));

        if (!relationship.getRecipientId().equals(principal.getId())) {
            throw new ForbiddenException("You are not authorized to reject this companion request");
        }

        companionRepository.updateStatus(relationshipId, "REJECTED");
        relationship.setStatus("REJECTED");

        return ApiResponse.success("Companion request rejected", relationship);
    }

    public ApiResponse<List<CompanionRelationship>> getAcceptedCompanions(UserPrincipal principal) {
        List<CompanionRelationship> list = companionRepository.findAcceptedCompanions(principal.getId());
        ApiResponse<List<CompanionRelationship>> response = ApiResponse.success("Accepted companions retrieved successfully", list);
        response.setCount(list.size());
        return response;
    }

    public ApiResponse<Void> removeCompanion(Long relationshipId, UserPrincipal principal) {
        CompanionRelationship relationship = companionRepository.findById(relationshipId)
                .orElseThrow(() -> new ResourceNotFoundException("Companion relationship not found"));

        Long userId = principal.getId();
        if (!relationship.getRequesterId().equals(userId) && !relationship.getRecipientId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to remove this companion relationship");
        }

        companionRepository.delete(relationshipId);
        return ApiResponse.success("Companion relationship removed successfully");
    }

    public ApiResponse<List<User>> searchUsers(String query, UserPrincipal principal) {
        if (query == null || query.trim().length() < 2) {
            return ApiResponse.success("Search results", List.of());
        }

        List<User> users = companionRepository.searchUsers(query.trim(), principal.getId());
        // Clean out sensitive data
        users.forEach(u -> u.setPasswordHash(null));
        ApiResponse<List<User>> response = ApiResponse.success("Matching users found", users);
        response.setCount(users.size());
        return response;
    }
}
