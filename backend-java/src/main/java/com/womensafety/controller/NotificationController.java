package com.womensafety.controller;

import com.womensafety.model.Notification;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // 6. View notifications for the authenticated user
    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<List<Notification>> response = notificationService.getNotifications(principal);
        return ResponseEntity.ok(response);
    }

    // 7. Mark a specific user notification as read
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<Void> response = notificationService.markAsRead(id, principal);
        return ResponseEntity.ok(response);
    }
}
