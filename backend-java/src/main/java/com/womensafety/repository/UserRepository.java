package com.womensafety.repository;

import com.womensafety.config.TursoClient;
import com.womensafety.model.User;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class UserRepository {

    private final TursoClient tursoClient;

    public UserRepository(TursoClient tursoClient) {
        this.tursoClient = tursoClient;
    }

    public Optional<User> findById(Long id) {
        String sql = "SELECT id, name, email, password_hash, state, district, phone, role, created_at, updated_at FROM users WHERE id = ?";
        return tursoClient.queryOne(sql, List.of(id)).map(this::mapRowToUser);
    }

    public Optional<User> findByEmail(String email) {
        String sql = "SELECT id, name, email, password_hash, state, district, phone, role, created_at, updated_at FROM users WHERE LOWER(email) = LOWER(?)";
        return tursoClient.queryOne(sql, List.of(email.trim())).map(this::mapRowToUser);
    }

    public boolean existsByEmail(String email) {
        String sql = "SELECT id FROM users WHERE LOWER(email) = LOWER(?)";
        return tursoClient.queryOne(sql, List.of(email.trim())).isPresent();
    }

    public boolean existsByEmailAndIdNot(String email, Long id) {
        String sql = "SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?";
        return tursoClient.queryOne(sql, List.of(email.trim(), id)).isPresent();
    }

    public List<User> findAll(String state, String district) {
        StringBuilder sql = new StringBuilder("SELECT id, name, email, state, district, phone, role, created_at, updated_at FROM users");
        List<Object> args = new ArrayList<>();

        if (state != null && !state.trim().isEmpty() && district != null && !district.trim().isEmpty()) {
            sql.append(" WHERE LOWER(state) = LOWER(?) AND LOWER(district) = LOWER(?)");
            args.add(state.trim());
            args.add(district.trim());
        } else if (state != null && !state.trim().isEmpty()) {
            sql.append(" WHERE LOWER(state) = LOWER(?)");
            args.add(state.trim());
        }

        sql.append(" ORDER BY created_at DESC");

        return tursoClient.query(sql.toString(), args).stream()
                .map(this::mapRowToUser)
                .toList();
    }

    public Long insert(String name, String email, String passwordHash, String state, String district, String phone, String role) {
        String sql = "INSERT INTO users (name, email, password_hash, state, district, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)";
        TursoClient.ExecuteResult res = tursoClient.update(sql, java.util.Arrays.asList(
                name.trim(),
                email.trim().toLowerCase(),
                passwordHash,
                state.trim(),
                district.trim(),
                phone != null ? phone.trim() : null,
                role != null ? role : "user"
        ));
        return res.lastInsertRowid();
    }

    public void update(Long id, String name, String email, String state, String district, String phone) {
        String sql = "UPDATE users SET name = ?, email = ?, state = ?, district = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        tursoClient.update(sql, java.util.Arrays.asList(
                name.trim(),
                email.trim().toLowerCase(),
                state.trim(),
                district.trim(),
                phone != null ? phone.trim() : null,
                id
        ));
    }

    public void deleteCascade(Long userId) {
        List<TursoClient.Statement> batch = List.of(
                new TursoClient.Statement("UPDATE places SET submitted_by = NULL WHERE submitted_by = ?", List.of(userId)),
                new TursoClient.Statement("DELETE FROM notifications WHERE user_id = ?", List.of(userId)),
                new TursoClient.Statement("DELETE FROM users WHERE id = ?", List.of(userId))
        );
        tursoClient.executeBatch(batch);
    }

    private User mapRowToUser(Map<String, Object> row) {
        User user = new User();
        if (row.get("id") != null) user.setId(((Number) row.get("id")).longValue());
        user.setName((String) row.get("name"));
        user.setEmail((String) row.get("email"));
        user.setPasswordHash((String) row.get("password_hash"));
        user.setState((String) row.get("state"));
        user.setDistrict((String) row.get("district"));
        user.setPhone((String) row.get("phone"));
        user.setRole((String) row.get("role"));
        user.setCreatedAt(row.get("created_at") != null ? row.get("created_at").toString() : null);
        user.setUpdatedAt(row.get("updated_at") != null ? row.get("updated_at").toString() : null);
        return user;
    }
}
