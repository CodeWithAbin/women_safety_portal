package com.womensafety.repository;

import com.womensafety.config.TursoClient;
import com.womensafety.model.CompanionRelationship;
import com.womensafety.model.User;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class CompanionRepository {

    private final TursoClient tursoClient;

    public CompanionRepository(TursoClient tursoClient) {
        this.tursoClient = tursoClient;
    }

    public Optional<CompanionRelationship> findById(Long id) {
        String sql = """
            SELECT 
                cr.id, cr.requester_id, cr.recipient_id, cr.status, cr.created_at, cr.updated_at,
                u1.name AS requester_name, u1.email AS requester_email,
                u2.name AS recipient_name, u2.email AS recipient_email
            FROM companion_relationships cr
            JOIN users u1 ON cr.requester_id = u1.id
            JOIN users u2 ON cr.recipient_id = u2.id
            WHERE cr.id = ?
        """;
        return tursoClient.queryOne(sql, List.of(id)).map(this::mapRowToRelationship);
    }

    public Optional<CompanionRelationship> findBetweenUsers(Long user1, Long user2) {
        String sql = """
            SELECT 
                cr.id, cr.requester_id, cr.recipient_id, cr.status, cr.created_at, cr.updated_at,
                u1.name AS requester_name, u1.email AS requester_email,
                u2.name AS recipient_name, u2.email AS recipient_email
            FROM companion_relationships cr
            JOIN users u1 ON cr.requester_id = u1.id
            JOIN users u2 ON cr.recipient_id = u2.id
            WHERE (cr.requester_id = ? AND cr.recipient_id = ?) 
               OR (cr.requester_id = ? AND cr.recipient_id = ?)
        """;
        return tursoClient.queryOne(sql, List.of(user1, user2, user2, user1)).map(this::mapRowToRelationship);
    }

    public boolean areAcceptedCompanions(Long user1, Long user2) {
        String sql = """
            SELECT id FROM companion_relationships
            WHERE status = 'ACCEPTED'
              AND ((requester_id = ? AND recipient_id = ?) OR (requester_id = ? AND recipient_id = ?))
        """;
        return tursoClient.queryOne(sql, List.of(user1, user2, user2, user1)).isPresent();
    }

    public List<CompanionRelationship> findPendingReceivedRequests(Long recipientId) {
        String sql = """
            SELECT 
                cr.id, cr.requester_id, cr.recipient_id, cr.status, cr.created_at, cr.updated_at,
                u1.name AS requester_name, u1.email AS requester_email,
                u2.name AS recipient_name, u2.email AS recipient_email
            FROM companion_relationships cr
            JOIN users u1 ON cr.requester_id = u1.id
            JOIN users u2 ON cr.recipient_id = u2.id
            WHERE cr.recipient_id = ? AND cr.status = 'PENDING'
            ORDER BY cr.created_at DESC
        """;
        return tursoClient.query(sql, List.of(recipientId)).stream()
                .map(this::mapRowToRelationship)
                .toList();
    }

    public List<CompanionRelationship> findPendingSentRequests(Long requesterId) {
        String sql = """
            SELECT 
                cr.id, cr.requester_id, cr.recipient_id, cr.status, cr.created_at, cr.updated_at,
                u1.name AS requester_name, u1.email AS requester_email,
                u2.name AS recipient_name, u2.email AS recipient_email
            FROM companion_relationships cr
            JOIN users u1 ON cr.requester_id = u1.id
            JOIN users u2 ON cr.recipient_id = u2.id
            WHERE cr.requester_id = ? AND cr.status = 'PENDING'
            ORDER BY cr.created_at DESC
        """;
        return tursoClient.query(sql, List.of(requesterId)).stream()
                .map(this::mapRowToRelationship)
                .toList();
    }

    public List<CompanionRelationship> findAcceptedCompanions(Long userId) {
        String sql = """
            SELECT 
                cr.id, cr.requester_id, cr.recipient_id, cr.status, cr.created_at, cr.updated_at,
                u.id AS companion_id,
                u.name AS companion_name,
                u.email AS companion_email,
                u.phone AS companion_phone,
                u.district AS companion_district,
                u.state AS companion_state
            FROM companion_relationships cr
            JOIN users u ON u.id = (CASE WHEN cr.requester_id = ? THEN cr.recipient_id ELSE cr.requester_id END)
            WHERE cr.status = 'ACCEPTED' AND (cr.requester_id = ? OR cr.recipient_id = ?)
            ORDER BY cr.updated_at DESC
        """;
        return tursoClient.query(sql, List.of(userId, userId, userId)).stream()
                .map(this::mapRowToRelationship)
                .toList();
    }

    public Long insert(Long requesterId, Long recipientId, String status) {
        String sql = "INSERT INTO companion_relationships (requester_id, recipient_id, status) VALUES (?, ?, ?)";
        TursoClient.ExecuteResult res = tursoClient.update(sql, List.of(requesterId, recipientId, status));
        return res.lastInsertRowid();
    }

    public void updateStatus(Long id, String status) {
        String sql = "UPDATE companion_relationships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        tursoClient.update(sql, List.of(status, id));
    }

    public void delete(Long id) {
        String sql = "DELETE FROM companion_relationships WHERE id = ?";
        tursoClient.update(sql, List.of(id));
    }

    public List<User> searchUsers(String query, Long currentUserId) {
        String sql = """
            SELECT id, name, email, state, district, phone, role, created_at, updated_at
            FROM users
            WHERE id != ? AND (LOWER(name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?))
            ORDER BY name ASC
            LIMIT 20
        """;
        String pattern = "%" + query.trim() + "%";
        return tursoClient.query(sql, List.of(currentUserId, pattern, pattern)).stream()
                .map(row -> {
                    User u = new User();
                    if (row.get("id") != null) u.setId(((Number) row.get("id")).longValue());
                    u.setName((String) row.get("name"));
                    u.setEmail((String) row.get("email"));
                    u.setState((String) row.get("state"));
                    u.setDistrict((String) row.get("district"));
                    u.setPhone((String) row.get("phone"));
                    u.setRole((String) row.get("role"));
                    return u;
                })
                .toList();
    }

    private CompanionRelationship mapRowToRelationship(Map<String, Object> row) {
        CompanionRelationship rel = new CompanionRelationship();
        if (row.get("id") != null) rel.setId(((Number) row.get("id")).longValue());
        if (row.get("requester_id") != null) rel.setRequesterId(((Number) row.get("requester_id")).longValue());
        if (row.get("recipient_id") != null) rel.setRecipientId(((Number) row.get("recipient_id")).longValue());
        rel.setStatus((String) row.get("status"));
        rel.setCreatedAt(row.get("created_at") != null ? row.get("created_at").toString() : null);
        rel.setUpdatedAt(row.get("updated_at") != null ? row.get("updated_at").toString() : null);

        rel.setRequesterName((String) row.get("requester_name"));
        rel.setRequesterEmail((String) row.get("requester_email"));
        rel.setRecipientName((String) row.get("recipient_name"));
        rel.setRecipientEmail((String) row.get("recipient_email"));

        if (row.get("companion_id") != null) rel.setCompanionId(((Number) row.get("companion_id")).longValue());
        rel.setCompanionName((String) row.get("companion_name"));
        rel.setCompanionEmail((String) row.get("companion_email"));
        rel.setCompanionPhone((String) row.get("companion_phone"));
        rel.setCompanionDistrict((String) row.get("companion_district"));
        rel.setCompanionState((String) row.get("companion_state"));

        return rel;
    }
}
