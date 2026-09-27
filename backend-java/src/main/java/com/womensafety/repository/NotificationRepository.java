package com.womensafety.repository;

import com.womensafety.config.TursoClient;
import com.womensafety.model.Notification;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class NotificationRepository {

    private final TursoClient tursoClient;

    public NotificationRepository(TursoClient tursoClient) {
        this.tursoClient = tursoClient;
    }

    public List<Notification> findByUserId(Long userId) {
        String sql = "SELECT id, user_id, place_id, title, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC";
        return tursoClient.query(sql, List.of(userId)).stream()
                .map(this::mapRowToNotification)
                .toList();
    }

    public Optional<Notification> findById(Long id) {
        String sql = "SELECT id, user_id, place_id, title, message, type, is_read, created_at FROM notifications WHERE id = ?";
        return tursoClient.queryOne(sql, List.of(id)).map(this::mapRowToNotification);
    }

    public void markAsRead(Long id) {
        String sql = "UPDATE notifications SET is_read = 1 WHERE id = ?";
        tursoClient.update(sql, List.of(id));
    }

    public Long insert(Long userId, Long placeId, String title, String message, String type) {
        String sql = "INSERT INTO notifications (user_id, place_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, 0)";
        TursoClient.ExecuteResult res = tursoClient.update(sql, java.util.Arrays.asList(userId, placeId, title, message, type != null ? type : "status_update"));
        return res.lastInsertRowid();
    }

    private Notification mapRowToNotification(Map<String, Object> row) {
        Notification n = new Notification();
        if (row.get("id") != null) n.setId(((Number) row.get("id")).longValue());
        if (row.get("user_id") != null) n.setUserId(((Number) row.get("user_id")).longValue());
        if (row.get("place_id") != null) n.setPlaceId(((Number) row.get("place_id")).longValue());
        n.setTitle((String) row.get("title"));
        n.setMessage((String) row.get("message"));
        n.setType((String) row.get("type"));
        if (row.get("is_read") != null) n.setIsRead(((Number) row.get("is_read")).intValue());
        n.setCreatedAt(row.get("created_at") != null ? row.get("created_at").toString() : null);
        return n;
    }
}
