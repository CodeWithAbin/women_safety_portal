package com.womensafety.repository;

import com.womensafety.config.TursoClient;
import com.womensafety.model.SafePlace;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class SafePlaceRepository {

    private final TursoClient tursoClient;

    public SafePlaceRepository(TursoClient tursoClient) {
        this.tursoClient = tursoClient;
    }

    public Optional<SafePlace> findById(Long id) {
        String sql = """
            SELECT 
                sp.id, sp.name, sp.address, sp.state, sp.district, sp.photo, sp.rating,
                sp.description, sp.status, sp.submitted_by, sp.latitude, sp.longitude,
                sp.created_at, sp.updated_at,
                u.name AS submitter_name, u.email AS submitter_email, u.phone AS submitter_phone
            FROM safe_places sp
            LEFT JOIN users u ON sp.submitted_by = u.id
            WHERE sp.id = ?
        """;
        return tursoClient.queryOne(sql, List.of(id)).map(this::mapRowToSafePlace);
    }

    public List<SafePlace> findReportsBySubmittedBy(Long userId) {
        String sql = """
            SELECT 
                sp.id, sp.name, sp.address, sp.state, sp.district, sp.photo, sp.rating,
                sp.description, sp.status, sp.submitted_by, sp.latitude, sp.longitude,
                sp.created_at, sp.updated_at,
                u.name AS submitter_name, u.email AS submitter_email, u.phone AS submitter_phone
            FROM safe_places sp
            LEFT JOIN users u ON sp.submitted_by = u.id
            WHERE sp.submitted_by = ?
            ORDER BY sp.created_at DESC, sp.id DESC
        """;
        return tursoClient.query(sql, List.of(userId)).stream()
                .map(this::mapRowToSafePlace)
                .toList();
    }

    public List<SafePlace> findAllAccepted(String state, String district, String search, Integer minRating, String sort) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                sp.id, sp.name, sp.address, sp.state, sp.district, sp.photo, sp.rating,
                sp.description, sp.status, sp.submitted_by, sp.latitude, sp.longitude,
                sp.created_at, sp.updated_at,
                u.name AS submitter_name, u.email AS submitter_email, u.phone AS submitter_phone
            FROM safe_places sp
            LEFT JOIN users u ON sp.submitted_by = u.id
            WHERE sp.status = 'accepted'
        """);

        List<Object> args = new ArrayList<>();

        if (state != null && !state.trim().isEmpty()) {
            sql.append(" AND LOWER(sp.state) = LOWER(?)");
            args.add(state.trim());
        }

        if (district != null && !district.trim().isEmpty()) {
            sql.append(" AND LOWER(sp.district) = LOWER(?)");
            args.add(district.trim());
        }

        if (minRating != null && minRating > 0) {
            sql.append(" AND sp.rating >= ?");
            args.add(minRating);
        }

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(sp.name) LIKE LOWER(?) OR LOWER(sp.address) LIKE LOWER(?) OR LOWER(sp.description) LIKE LOWER(?))");
            String term = "%" + search.trim() + "%";
            args.add(term);
            args.add(term);
            args.add(term);
        }

        if ("rating_desc".equalsIgnoreCase(sort) || "rating".equalsIgnoreCase(sort)) {
            sql.append(" ORDER BY sp.rating DESC, sp.created_at DESC");
        } else if ("rating_asc".equalsIgnoreCase(sort)) {
            sql.append(" ORDER BY sp.rating ASC, sp.created_at DESC");
        } else if ("oldest".equalsIgnoreCase(sort)) {
            sql.append(" ORDER BY sp.created_at ASC, sp.id ASC");
        } else {
            // Default newest first
            sql.append(" ORDER BY sp.created_at DESC, sp.id DESC");
        }

        return tursoClient.query(sql.toString(), args).stream()
                .map(this::mapRowToSafePlace)
                .toList();
    }

    public List<SafePlace> findAllForAdmin(String status, String state, String district, String search) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                sp.id, sp.name, sp.address, sp.state, sp.district, sp.photo, sp.rating,
                sp.description, sp.status, sp.submitted_by, sp.latitude, sp.longitude,
                sp.created_at, sp.updated_at,
                u.name AS submitter_name, u.email AS submitter_email, u.phone AS submitter_phone
            FROM safe_places sp
            LEFT JOIN users u ON sp.submitted_by = u.id
            WHERE 1=1
        """);

        List<Object> args = new ArrayList<>();

        if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status.trim())) {
            sql.append(" AND LOWER(sp.status) = LOWER(?)");
            args.add(status.trim());
        }

        if (state != null && !state.trim().isEmpty()) {
            sql.append(" AND LOWER(sp.state) = LOWER(?)");
            args.add(state.trim());
        }

        if (district != null && !district.trim().isEmpty()) {
            sql.append(" AND LOWER(sp.district) = LOWER(?)");
            args.add(district.trim());
        }

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(sp.name) LIKE LOWER(?) OR LOWER(sp.address) LIKE LOWER(?) OR LOWER(u.name) LIKE LOWER(?))");
            String term = "%" + search.trim() + "%";
            args.add(term);
            args.add(term);
            args.add(term);
        }

        sql.append(" ORDER BY sp.created_at DESC, sp.id DESC");

        return tursoClient.query(sql.toString(), args).stream()
                .map(this::mapRowToSafePlace)
                .toList();
    }

    public int countByStatus(String status) {
        String sql = "SELECT COUNT(*) as count FROM safe_places WHERE LOWER(status) = LOWER(?)";
        List<Map<String, Object>> rows = tursoClient.query(sql, List.of(status));
        if (!rows.isEmpty() && rows.get(0).get("count") != null) {
            return ((Number) rows.get(0).get("count")).intValue();
        }
        return 0;
    }

    public Long insert(SafePlace sp) {
        String sql = """
            INSERT INTO safe_places (
                name, address, state, district, photo, rating, description,
                status, submitted_by, latitude, longitude, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """;

        List<Object> args = Arrays.asList(
                sp.getName(),
                sp.getAddress(),
                sp.getState(),
                sp.getDistrict(),
                sp.getPhoto() != null ? sp.getPhoto() : "",
                sp.getRating() != null ? sp.getRating() : 5,
                sp.getDescription(),
                sp.getStatus() != null ? sp.getStatus() : "pending",
                sp.getSubmittedBy(),
                sp.getLatitude(),
                sp.getLongitude()
        );

        TursoClient.ExecuteResult res = tursoClient.update(sql, args);
        return res.lastInsertRowid();
    }

    public void updateStatus(Long id, String status) {
        String sql = "UPDATE safe_places SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        tursoClient.update(sql, List.of(status.toLowerCase(), id));
    }

    public void delete(Long id) {
        String sql = "DELETE FROM safe_places WHERE id = ?";
        tursoClient.update(sql, List.of(id));
    }

    private SafePlace mapRowToSafePlace(Map<String, Object> row) {
        SafePlace sp = new SafePlace();
        if (row.get("id") != null) sp.setId(((Number) row.get("id")).longValue());
        sp.setName((String) row.get("name"));
        sp.setAddress((String) row.get("address"));
        sp.setState((String) row.get("state"));
        sp.setDistrict((String) row.get("district"));
        sp.setPhoto((String) row.get("photo"));
        if (row.get("rating") != null) sp.setRating(((Number) row.get("rating")).intValue());
        sp.setDescription((String) row.get("description"));
        sp.setStatus((String) row.get("status"));
        if (row.get("submitted_by") != null) sp.setSubmittedBy(((Number) row.get("submitted_by")).longValue());
        if (row.get("latitude") != null) sp.setLatitude(((Number) row.get("latitude")).doubleValue());
        if (row.get("longitude") != null) sp.setLongitude(((Number) row.get("longitude")).doubleValue());
        sp.setCreatedAt(row.get("created_at") != null ? row.get("created_at").toString() : null);
        sp.setUpdatedAt(row.get("updated_at") != null ? row.get("updated_at").toString() : null);

        sp.setSubmitterName((String) row.get("submitter_name"));
        sp.setSubmitterEmail((String) row.get("submitter_email"));
        sp.setSubmitterPhone((String) row.get("submitter_phone"));
        return sp;
    }
}
