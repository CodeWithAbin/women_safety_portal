package com.womensafety.repository;

import com.womensafety.config.TursoClient;
import com.womensafety.model.Place;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class PlaceRepository {

    private final TursoClient tursoClient;

    public PlaceRepository(TursoClient tursoClient) {
        this.tursoClient = tursoClient;
    }

    public Optional<Place> findById(Long id) {
        String sql = """
            SELECT 
                p.id, p.name, p.address, p.state, p.district, p.photo, p.rating,
                (
                    SELECT ROUND(AVG(loc.rating), 1) 
                    FROM places loc 
                    WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                      AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                      AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                      AND loc.status = 'accepted'
                ) AS community_rating,
                (
                    SELECT COUNT(loc.rating) 
                    FROM places loc 
                    WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                      AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                      AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                      AND loc.status = 'accepted'
                ) AS rating_count,
                p.description, 
                p.status, p.submitted_by, p.created_at, p.updated_at,
                (SELECT COUNT(*) FROM report_supports rs WHERE rs.report_id = p.id) AS support_count
            FROM places p 
            WHERE p.id = ?
        """;
        return tursoClient.queryOne(sql, List.of(id)).map(this::mapRowToPlace);
    }

    public List<Place> findAllAccepted(String state, String district, String search, Integer minRating, String sort, Long currentUserId) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                p.id,
                p.name,
                p.address,
                p.state,
                p.district,
                p.photo,
                p.rating,
                (
                    SELECT ROUND(AVG(loc.rating), 1) 
                    FROM places loc 
                    WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                      AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                      AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                      AND loc.status = 'accepted'
                ) AS community_rating,
                (
                    SELECT COUNT(loc.rating) 
                    FROM places loc 
                    WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                      AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                      AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                      AND loc.status = 'accepted'
                ) AS rating_count,
                p.description,
                p.status,
                p.submitted_by,
                p.created_at,
                p.updated_at,
                (SELECT COUNT(*) FROM report_supports rs WHERE rs.report_id = p.id) AS support_count,
                (SELECT COUNT(*) FROM report_supports rs WHERE rs.report_id = p.id AND rs.user_id = ?) AS user_supported
            FROM places p
            WHERE p.status = 'accepted'
        """);
        List<Object> args = new ArrayList<>();
        args.add(currentUserId != null ? currentUserId : -1L);

        if (state != null && !state.trim().isEmpty() && district != null && !district.trim().isEmpty()) {
            sql.append(" AND LOWER(TRIM(p.state)) = LOWER(TRIM(?)) AND LOWER(TRIM(p.district)) = LOWER(TRIM(?))");
            args.add(state.trim());
            args.add(district.trim());
        } else if (state != null && !state.trim().isEmpty()) {
            sql.append(" AND LOWER(TRIM(p.state)) = LOWER(TRIM(?))");
            args.add(state.trim());
        }

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(p.name) LIKE ? OR LOWER(p.address) LIKE ?)");
            String searchPattern = "%" + search.trim().toLowerCase() + "%";
            args.add(searchPattern);
            args.add(searchPattern);
        }

        if (minRating != null) {
            sql.append("""
                 AND (
                     SELECT AVG(loc.rating) 
                     FROM places loc 
                     WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                       AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                       AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                       AND loc.status = 'accepted'
                 ) >= ?
            """);
            args.add(minRating);
        }

        if ("rating_desc".equalsIgnoreCase(sort)) {
            sql.append("""
                 ORDER BY (
                     SELECT AVG(loc.rating) 
                     FROM places loc 
                     WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                       AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                       AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                       AND loc.status = 'accepted'
                 ) DESC, p.created_at DESC, p.id DESC
            """);
        } else if ("rating_asc".equalsIgnoreCase(sort)) {
            sql.append("""
                 ORDER BY (
                     SELECT AVG(loc.rating) 
                     FROM places loc 
                     WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                       AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                       AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                       AND loc.status = 'accepted'
                 ) ASC, p.created_at DESC, p.id DESC
            """);
        } else if ("newest".equalsIgnoreCase(sort)) {
            sql.append(" ORDER BY p.created_at DESC, p.id DESC");
        } else {
            sql.append(" ORDER BY p.created_at DESC, p.id DESC");
        }

        return tursoClient.query(sql.toString(), args).stream()
                .map(this::mapRowToPlace)
                .toList();
    }

    public List<Place> findReports(String status) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                p.id, p.name, p.address, p.state, p.district, p.photo, p.rating,
                (
                    SELECT ROUND(AVG(loc.rating), 1) 
                    FROM places loc 
                    WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                      AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                      AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                      AND loc.status = 'accepted'
                ) AS community_rating,
                (
                    SELECT COUNT(loc.rating) 
                    FROM places loc 
                    WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                      AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                      AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                      AND loc.status = 'accepted'
                ) AS rating_count,
                p.description, 
                p.status, p.submitted_by, p.created_at, p.updated_at,
                u.name AS reporter_name, u.email AS reporter_email, u.phone AS reporter_phone,
                (SELECT COUNT(*) FROM report_supports rs WHERE rs.report_id = p.id) AS support_count
            FROM places p
            LEFT JOIN users u ON p.submitted_by = u.id
        """);
        List<Object> args = new ArrayList<>();

        if (status != null && !status.trim().isEmpty()) {
            sql.append(" WHERE p.status = ?");
            args.add(status.trim().toLowerCase());
        }

        sql.append(" ORDER BY p.created_at DESC");

        return tursoClient.query(sql.toString(), args).stream()
                .map(this::mapRowToPlace)
                .toList();
    }

    public List<Place> findAdminPlaces(String state, String district, String search, Integer minRating, String sort) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                p.id,
                p.name,
                p.address,
                p.state,
                p.district,
                p.photo,
                p.rating,
                (
                    SELECT ROUND(AVG(loc.rating), 1) 
                    FROM places loc 
                    WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                      AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                      AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                      AND loc.status = 'accepted'
                ) AS community_rating,
                (
                    SELECT COUNT(loc.rating) 
                    FROM places loc 
                    WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                      AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                      AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                      AND loc.status = 'accepted'
                ) AS rating_count,
                p.description,
                p.status,
                p.submitted_by,
                p.created_at,
                p.updated_at,
                u.name AS reporter_name,
                u.email AS reporter_email,
                (SELECT COUNT(*) FROM report_supports rs WHERE rs.report_id = p.id) AS support_count
            FROM places p
            LEFT JOIN users u ON p.submitted_by = u.id
            WHERE p.status = 'accepted'
        """);
        List<Object> args = new ArrayList<>();

        if (state != null && !state.trim().isEmpty() && district != null && !district.trim().isEmpty()) {
            sql.append(" AND LOWER(TRIM(p.state)) = LOWER(TRIM(?)) AND LOWER(TRIM(p.district)) = LOWER(TRIM(?))");
            args.add(state.trim());
            args.add(district.trim());
        } else if (state != null && !state.trim().isEmpty()) {
            sql.append(" AND LOWER(TRIM(p.state)) = LOWER(TRIM(?))");
            args.add(state.trim());
        }

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(p.name) LIKE ? OR LOWER(p.address) LIKE ?)");
            String searchPattern = "%" + search.trim().toLowerCase() + "%";
            args.add(searchPattern);
            args.add(searchPattern);
        }

        if (minRating != null) {
            sql.append("""
                 AND (
                     SELECT AVG(loc.rating) 
                     FROM places loc 
                     WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                       AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                       AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                       AND loc.status = 'accepted'
                 ) >= ?
            """);
            args.add(minRating);
        }

        if ("rating_desc".equalsIgnoreCase(sort)) {
            sql.append("""
                 ORDER BY (
                     SELECT AVG(loc.rating) 
                     FROM places loc 
                     WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                       AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                       AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                       AND loc.status = 'accepted'
                 ) DESC, p.created_at DESC, p.id DESC
            """);
        } else if ("rating_asc".equalsIgnoreCase(sort)) {
            sql.append("""
                 ORDER BY (
                     SELECT AVG(loc.rating) 
                     FROM places loc 
                     WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(p.address)) 
                       AND LOWER(TRIM(loc.state)) = LOWER(TRIM(p.state)) 
                       AND LOWER(TRIM(loc.district)) = LOWER(TRIM(p.district))
                       AND loc.status = 'accepted'
                 ) ASC, p.created_at DESC, p.id DESC
            """);
        } else if ("newest".equalsIgnoreCase(sort)) {
            sql.append(" ORDER BY p.created_at DESC, p.id DESC");
        } else {
            sql.append(" ORDER BY p.created_at DESC, p.id DESC");
        }

        return tursoClient.query(sql.toString(), args).stream()
                .map(this::mapRowToPlace)
                .toList();
    }

    public void addSupport(Long reportId, Long userId) {
        String sql = "INSERT OR IGNORE INTO report_supports (report_id, user_id) VALUES (?, ?)";
        tursoClient.update(sql, List.of(reportId, userId));
    }

    public int getSupportCount(Long reportId) {
        String sql = "SELECT COUNT(*) AS cnt FROM report_supports WHERE report_id = ?";
        return tursoClient.queryOne(sql, List.of(reportId))
                .map(r -> ((Number) r.get("cnt")).intValue())
                .orElse(0);
    }

    public boolean hasUserSupported(Long reportId, Long userId) {
        if (userId == null) return false;
        String sql = "SELECT COUNT(*) AS cnt FROM report_supports WHERE report_id = ? AND user_id = ?";
        return tursoClient.queryOne(sql, List.of(reportId, userId))
                .map(r -> ((Number) r.get("cnt")).intValue() > 0)
                .orElse(false);
    }

    public Optional<Place> findSimilarAcceptedReport(String state, String district, String address, String name) {
        if (state == null || district == null || address == null || name == null) {
            return Optional.empty();
        }
        String normalizedAddress = normalizeText(address);
        String normalizedName = normalizeText(name);

        String sql = """
            SELECT id, name, address, state, district, photo, rating,
                   (
                       SELECT ROUND(AVG(loc.rating), 1) 
                       FROM places loc 
                       WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(places.address)) 
                         AND LOWER(TRIM(loc.state)) = LOWER(TRIM(places.state)) 
                         AND LOWER(TRIM(loc.district)) = LOWER(TRIM(places.district))
                         AND loc.status = 'accepted'
                   ) AS community_rating,
                   (
                       SELECT COUNT(loc.rating) 
                       FROM places loc 
                       WHERE LOWER(TRIM(loc.address)) = LOWER(TRIM(places.address)) 
                         AND LOWER(TRIM(loc.state)) = LOWER(TRIM(places.state)) 
                         AND LOWER(TRIM(loc.district)) = LOWER(TRIM(places.district))
                         AND loc.status = 'accepted'
                   ) AS rating_count,
                   description, status, submitted_by, created_at, updated_at,
                   (SELECT COUNT(*) FROM report_supports rs WHERE rs.report_id = places.id) AS support_count
            FROM places
            WHERE status = 'accepted'
              AND LOWER(TRIM(state)) = LOWER(TRIM(?))
              AND LOWER(TRIM(district)) = LOWER(TRIM(?))
        """;

        List<Place> candidates = tursoClient.query(sql, List.of(state.trim(), district.trim())).stream()
                .map(this::mapRowToPlace)
                .toList();

        for (Place cand : candidates) {
            String candAddress = normalizeText(cand.getAddress());
            String candName = normalizeText(cand.getName());

            if (candAddress.equals(normalizedAddress) && candName.equals(normalizedName)) {
                return Optional.of(cand);
            }
        }
        return Optional.empty();
    }

    private String normalizeText(String input) {
        if (input == null) return "";
        return input.trim().toLowerCase().replaceAll("\\s+", " ");
    }

    public Long insertReport(String name, String address, String state, String district, String photo, int rating, String description, Long submittedBy) {
        String sql = "INSERT INTO places (name, address, state, district, photo, rating, description, status, submitted_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)";
        TursoClient.ExecuteResult res = tursoClient.update(sql, java.util.Arrays.asList(
                name.trim(),
                address.trim(),
                state.trim(),
                district.trim(),
                photo,
                rating,
                description.trim(),
                submittedBy
        ));
        return res.lastInsertRowid();
    }

    public Long insertAdminPlace(String name, String address, String state, String district, String photo, int rating, String description) {
        String sql = "INSERT INTO places (name, address, state, district, photo, rating, description, status, submitted_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'accepted', NULL)";
        TursoClient.ExecuteResult res = tursoClient.update(sql, java.util.Arrays.asList(
                name.trim(),
                address.trim(),
                state.trim(),
                district.trim(),
                photo,
                rating,
                description.trim()
        ));
        return res.lastInsertRowid();
    }

    public void update(Long id, String name, String address, String state, String district, String photo, int rating, String description) {
        String sql = "UPDATE places SET name = ?, address = ?, state = ?, district = ?, photo = ?, rating = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        tursoClient.update(sql, java.util.Arrays.asList(
                name.trim(),
                address.trim(),
                state.trim(),
                district.trim(),
                photo,
                rating,
                description.trim(),
                id
        ));
    }

    public void updateStatusWithNotification(Long reportId, String normalizedStatus, Place place) {
        List<TursoClient.Statement> batch = new ArrayList<>();
        batch.add(new TursoClient.Statement(
                "UPDATE places SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                java.util.Arrays.asList(normalizedStatus, reportId)
        ));

        if (place.getSubmittedBy() != null) {
            String title;
            String message;
            String type;
            if ("accepted".equals(normalizedStatus)) {
                title = "Report Accepted";
                message = "Your report for \"" + place.getName() + "\" has been verified and published as an accepted hazardous place.";
                type = "report_accepted";
            } else {
                title = "Report Rejected";
                message = "Your report for \"" + place.getName() + "\" has been reviewed and was not accepted by the administrator.";
                type = "report_rejected";
            }

            batch.add(new TursoClient.Statement(
                    "INSERT INTO notifications (user_id, place_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, 0)",
                    java.util.Arrays.asList(place.getSubmittedBy(), place.getId(), title, message, type)
            ));
        }

        tursoClient.executeBatch(batch);
    }

    public void delete(Long id) {
        tursoClient.update("DELETE FROM places WHERE id = ?", List.of(id));
    }

    private Place mapRowToPlace(Map<String, Object> row) {
        Place place = new Place();
        if (row.get("id") != null) place.setId(((Number) row.get("id")).longValue());
        place.setName((String) row.get("name"));
        place.setAddress((String) row.get("address"));
        place.setState((String) row.get("state"));
        place.setDistrict((String) row.get("district"));
        place.setPhoto((String) row.get("photo"));
        if (row.get("rating") != null) place.setRating(((Number) row.get("rating")).intValue());
        place.setDescription((String) row.get("description"));
        place.setStatus((String) row.get("status"));
        if (row.get("submitted_by") != null) place.setSubmittedBy(((Number) row.get("submitted_by")).longValue());
        place.setCreatedAt(row.get("created_at") != null ? row.get("created_at").toString() : null);
        place.setUpdatedAt(row.get("updated_at") != null ? row.get("updated_at").toString() : null);

        if (row.get("community_rating") != null) {
            place.setCommunityRating(((Number) row.get("community_rating")).doubleValue());
        } else if (row.get("rating") != null) {
            place.setCommunityRating(((Number) row.get("rating")).doubleValue());
        }

        if (row.get("rating_count") != null) {
            place.setRatingCount(((Number) row.get("rating_count")).intValue());
        } else {
            place.setRatingCount(1);
        }

        if (row.get("support_count") != null) {
            place.setSupportCount(((Number) row.get("support_count")).intValue());
        } else {
            place.setSupportCount(0);
        }

        if (row.get("user_supported") != null) {
            place.setHasSupported(((Number) row.get("user_supported")).intValue() > 0);
        } else {
            place.setHasSupported(false);
        }

        if (row.containsKey("reporter_name")) place.setReporterName((String) row.get("reporter_name"));
        if (row.containsKey("reporter_email")) place.setReporterEmail((String) row.get("reporter_email"));
        if (row.containsKey("reporter_phone")) place.setReporterPhone((String) row.get("reporter_phone"));

        return place;
    }
}
