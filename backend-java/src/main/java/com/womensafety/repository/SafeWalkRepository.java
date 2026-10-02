package com.womensafety.repository;

import com.womensafety.config.TursoClient;
import com.womensafety.model.SafeWalk;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class SafeWalkRepository {

    private final TursoClient tursoClient;

    public SafeWalkRepository(TursoClient tursoClient) {
        this.tursoClient = tursoClient;
    }

    public Optional<SafeWalk> findById(Long id) {
        String sql = """
            SELECT 
                sw.id, sw.user_id, sw.companion_id, sw.start_latitude, sw.start_longitude,
                sw.destination, sw.expected_arrival, sw.status, sw.last_latitude, sw.last_longitude,
                sw.last_location_updated_at, sw.overdue_notified_at,
                sw.started_at, sw.completed_at, sw.cancelled_at, sw.created_at, sw.updated_at,
                u1.name AS user_name, u1.email AS user_email, u1.phone AS user_phone,
                u2.name AS companion_name, u2.email AS companion_email, u2.phone AS companion_phone
            FROM safe_walks sw
            JOIN users u1 ON sw.user_id = u1.id
            JOIN users u2 ON sw.companion_id = u2.id
            WHERE sw.id = ?
        """;
        return tursoClient.queryOne(sql, List.of(id)).map(this::mapRowToSafeWalk);
    }

    public Optional<SafeWalk> findActiveForUserOrCompanion(Long userId) {
        String sql = """
            SELECT 
                sw.id, sw.user_id, sw.companion_id, sw.start_latitude, sw.start_longitude,
                sw.destination, sw.expected_arrival, sw.status, sw.last_latitude, sw.last_longitude,
                sw.last_location_updated_at, sw.overdue_notified_at,
                sw.started_at, sw.completed_at, sw.cancelled_at, sw.created_at, sw.updated_at,
                u1.name AS user_name, u1.email AS user_email, u1.phone AS user_phone,
                u2.name AS companion_name, u2.email AS companion_email, u2.phone AS companion_phone
            FROM safe_walks sw
            JOIN users u1 ON sw.user_id = u1.id
            JOIN users u2 ON sw.companion_id = u2.id
            WHERE (sw.user_id = ? OR sw.companion_id = ?) AND sw.status = 'ACTIVE'
            ORDER BY sw.created_at DESC
            LIMIT 1
        """;
        return tursoClient.queryOne(sql, List.of(userId, userId)).map(this::mapRowToSafeWalk);
    }

    public Optional<SafeWalk> findActiveWalkerJourney(Long userId) {
        String sql = """
            SELECT 
                sw.id, sw.user_id, sw.companion_id, sw.start_latitude, sw.start_longitude,
                sw.destination, sw.expected_arrival, sw.status, sw.last_latitude, sw.last_longitude,
                sw.last_location_updated_at, sw.overdue_notified_at,
                sw.started_at, sw.completed_at, sw.cancelled_at, sw.created_at, sw.updated_at,
                u1.name AS user_name, u1.email AS user_email, u1.phone AS user_phone,
                u2.name AS companion_name, u2.email AS companion_email, u2.phone AS companion_phone
            FROM safe_walks sw
            JOIN users u1 ON sw.user_id = u1.id
            JOIN users u2 ON sw.companion_id = u2.id
            WHERE sw.user_id = ? AND sw.status = 'ACTIVE'
            ORDER BY sw.created_at DESC
            LIMIT 1
        """;
        return tursoClient.queryOne(sql, List.of(userId)).map(this::mapRowToSafeWalk);
    }

    public Long insert(Long userId, Long companionId, Double startLat, Double startLng, String destination, String expectedArrival) {
        String sql = """
            INSERT INTO safe_walks 
            (user_id, companion_id, start_latitude, start_longitude, destination, expected_arrival, status, last_latitude, last_longitude, last_location_updated_at, started_at)
            VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, CASE WHEN ? IS NOT NULL AND ? IS NOT NULL THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP)
        """;
        TursoClient.ExecuteResult res = tursoClient.update(sql, java.util.Arrays.asList(
                userId,
                companionId,
                startLat,
                startLng,
                destination.trim(),
                expectedArrival,
                startLat,
                startLng,
                startLat,
                startLng
        ));
        return res.lastInsertRowid();
    }

    public void markCompleted(Long id) {
        String sql = "UPDATE safe_walks SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        tursoClient.update(sql, List.of(id));
    }

    public void markCancelled(Long id) {
        String sql = "UPDATE safe_walks SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        tursoClient.update(sql, List.of(id));
    }

    public void updateLocation(Long id, Double lat, Double lng) {
        String sql = "UPDATE safe_walks SET last_latitude = ?, last_longitude = ?, last_location_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        tursoClient.update(sql, java.util.Arrays.asList(lat, lng, id));
    }

    public void extendJourney(Long id, String newExpectedArrival) {
        String sql = "UPDATE safe_walks SET expected_arrival = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        tursoClient.update(sql, java.util.Arrays.asList(newExpectedArrival, id));
    }

    public int markOverdueNotified(Long id) {
        String sql = "UPDATE safe_walks SET overdue_notified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND overdue_notified_at IS NULL";
        TursoClient.ExecuteResult res = tursoClient.update(sql, List.of(id));
        return res.affectedRows();
    }

    private SafeWalk mapRowToSafeWalk(Map<String, Object> row) {
        SafeWalk walk = new SafeWalk();
        if (row.get("id") != null) walk.setId(((Number) row.get("id")).longValue());
        if (row.get("user_id") != null) walk.setUserId(((Number) row.get("user_id")).longValue());
        if (row.get("companion_id") != null) walk.setCompanionId(((Number) row.get("companion_id")).longValue());

        if (row.get("start_latitude") != null) walk.setStartLatitude(((Number) row.get("start_latitude")).doubleValue());
        if (row.get("start_longitude") != null) walk.setStartLongitude(((Number) row.get("start_longitude")).doubleValue());
        walk.setDestination((String) row.get("destination"));
        walk.setExpectedArrival(row.get("expected_arrival") != null ? row.get("expected_arrival").toString() : null);
        walk.setStatus((String) row.get("status"));

        if (row.get("last_latitude") != null) walk.setLastLatitude(((Number) row.get("last_latitude")).doubleValue());
        if (row.get("last_longitude") != null) walk.setLastLongitude(((Number) row.get("last_longitude")).doubleValue());
        walk.setLastLocationUpdatedAt(row.get("last_location_updated_at") != null ? row.get("last_location_updated_at").toString() : null);
        walk.setOverdueNotifiedAt(row.get("overdue_notified_at") != null ? row.get("overdue_notified_at").toString() : null);

        walk.setStartedAt(row.get("started_at") != null ? row.get("started_at").toString() : null);
        walk.setCompletedAt(row.get("completed_at") != null ? row.get("completed_at").toString() : null);
        walk.setCancelledAt(row.get("cancelled_at") != null ? row.get("cancelled_at").toString() : null);
        walk.setCreatedAt(row.get("created_at") != null ? row.get("created_at").toString() : null);
        walk.setUpdatedAt(row.get("updated_at") != null ? row.get("updated_at").toString() : null);

        walk.setUserName((String) row.get("user_name"));
        walk.setUserEmail((String) row.get("user_email"));
        walk.setUserPhone((String) row.get("user_phone"));
        walk.setCompanionName((String) row.get("companion_name"));
        walk.setCompanionEmail((String) row.get("companion_email"));
        walk.setCompanionPhone((String) row.get("companion_phone"));

        return walk;
    }
}
