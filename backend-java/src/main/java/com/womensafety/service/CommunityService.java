package com.womensafety.service;

import com.womensafety.model.CommunityMessage;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.CreateCommunityMessageRequest;
import com.womensafety.repository.CommunityMessageRepository;
import com.womensafety.repository.NotificationRepository;
import com.womensafety.security.UserPrincipal;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CommunityService {

    private final CommunityMessageRepository communityMessageRepository;
    private final NotificationRepository notificationRepository;

    public CommunityService(
            CommunityMessageRepository communityMessageRepository,
            NotificationRepository notificationRepository) {
        this.communityMessageRepository = communityMessageRepository;
        this.notificationRepository = notificationRepository;
    }

    public ApiResponse<List<CommunityMessage>> getRecentMessages() {
        List<CommunityMessage> messages = communityMessageRepository.findRecentMessages(50);
        ApiResponse<List<CommunityMessage>> response = ApiResponse.success("Recent messages retrieved", messages);
        response.setCount(messages.size());
        return response;
    }

    public ApiResponse<CommunityMessage> sendMessage(UserPrincipal principal, CreateCommunityMessageRequest request) {
        if (principal == null || principal.getId() == null) {
            return ApiResponse.error("Authentication required to send community messages");
        }

        String rawMessage = request.getMessage();
        if (rawMessage == null || rawMessage.trim().isEmpty()) {
            return ApiResponse.error("Message cannot be empty");
        }

        String trimmed = rawMessage.trim();
        if (trimmed.length() > 1000) {
            return ApiResponse.error("Message cannot exceed 1000 characters");
        }

        Long replyToId = request.getReplyToMessageId();
        Long validReplyToId = null;

        if (replyToId != null && replyToId > 0) {
            Optional<CommunityMessage> parentMsgOpt = communityMessageRepository.findById(replyToId);
            if (parentMsgOpt.isPresent()) {
                CommunityMessage parent = parentMsgOpt.get();
                if (parent.getIsDeleted() == null || parent.getIsDeleted() == 0) {
                    validReplyToId = parent.getId();

                    // If not replying to oneself, send a notification to the original author
                    if (parent.getUserId() != null && !parent.getUserId().equals(principal.getId())) {
                        try {
                            String senderName = principal.getName() != null ? principal.getName() : "A user";
                            notificationRepository.insert(
                                    parent.getUserId(),
                                    null,
                                    "New Community Reply",
                                    senderName + " replied to your community message.",
                                    "community_reply"
                            );
                        } catch (Exception ignored) {
                            // Notification failure should not block message creation
                        }
                    }
                }
            }
        }

        Long newId = communityMessageRepository.insert(principal.getId(), trimmed, validReplyToId);
        Optional<CommunityMessage> created = communityMessageRepository.findById(newId);

        return created
                .map(communityMessage -> ApiResponse.success("Message sent successfully", communityMessage))
                .orElseGet(() -> ApiResponse.success("Message sent successfully"));
    }

    public ApiResponse<Void> deleteMessage(Long id, UserPrincipal principal) {
        if (principal == null || !"admin".equalsIgnoreCase(principal.getRole())) {
            return ApiResponse.error("Unauthorized: only administrators can delete community messages");
        }

        Optional<CommunityMessage> existing = communityMessageRepository.findById(id);
        if (existing.isEmpty()) {
            return ApiResponse.error("Message not found");
        }

        communityMessageRepository.softDelete(id);
        return ApiResponse.success("Community message removed successfully");
    }
}
