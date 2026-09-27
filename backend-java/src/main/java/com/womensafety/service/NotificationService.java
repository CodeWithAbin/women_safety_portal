package com.womensafety.service;

import com.womensafety.exception.ForbiddenException;
import com.womensafety.exception.ResourceNotFoundException;
import com.womensafety.model.Notification;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.repository.NotificationRepository;
import com.womensafety.security.UserPrincipal;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public ApiResponse<List<Notification>> getNotifications(UserPrincipal principal) {
        List<Notification> notifications = notificationRepository.findByUserId(principal.getId());
        int unreadCount = (int) notifications.stream()
                .filter(n -> n.getIsRead() != null && n.getIsRead() == 0)
                .count();

        ApiResponse<List<Notification>> response = ApiResponse.success("Notifications retrieved successfully", notifications);
        response.setCount(notifications.size());
        response.setUnreadCount(unreadCount);
        return response;
    }

    public ApiResponse<Void> markAsRead(Long notificationId, UserPrincipal principal) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));

        if (!notification.getUserId().equals(principal.getId())) {
            throw new ForbiddenException("Access forbidden. You cannot modify notifications belonging to another user.");
        }

        notificationRepository.markAsRead(notificationId);
        return ApiResponse.success("Notification marked as read.");
    }
}
