package com.womensafety.repository;

import com.womensafety.config.TursoClient;
import com.womensafety.model.PasswordReset;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class PasswordResetRepository {

    private final TursoClient tursoClient;

    public PasswordResetRepository(TursoClient tursoClient) {
        this.tursoClient = tursoClient;
    }

    public void invalidateActiveRequests(String email) {
        String sql = "UPDATE password_resets SET used = 1 WHERE LOWER(email) = LOWER(?) AND used = 0";
        tursoClient.update(sql, List.of(email.trim()));
    }

    public Long create(String email, String tokenHash, String expiresAt) {
        String sql = "INSERT INTO password_resets (email, token_hash, expires_at, verified, attempts, used) VALUES (?, ?, ?, 0, 0, 0)";
        TursoClient.ExecuteResult res = tursoClient.update(sql, List.of(email.trim().toLowerCase(), tokenHash, expiresAt));
        return res.lastInsertRowid();
    }

    public Optional<PasswordReset> findActiveByEmail(String email) {
        String sql = """
            SELECT id, email, token_hash, reset_token_hash, verified, attempts, used, expires_at, verified_at, created_at
            FROM password_resets
            WHERE LOWER(email) = LOWER(?) AND used = 0 AND datetime(expires_at) > datetime('now')
            ORDER BY id DESC LIMIT 1
        """;
        return tursoClient.queryOne(sql, List.of(email.trim())).map(this::mapRowToPasswordReset);
    }

    public void incrementAttempts(Long id) {
        String sql = "UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?";
        tursoClient.update(sql, List.of(id));
    }

    public void markVerified(Long id, String resetTokenHash) {
        String sql = "UPDATE password_resets SET verified = 1, reset_token_hash = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?";
        tursoClient.update(sql, List.of(resetTokenHash, id));
    }

    public Optional<PasswordReset> findVerifiedByEmailAndResetTokenHash(String email, String resetTokenHash) {
        String sql = """
            SELECT id, email, token_hash, reset_token_hash, verified, attempts, used, expires_at, verified_at, created_at
            FROM password_resets
            WHERE LOWER(email) = LOWER(?) AND reset_token_hash = ? AND verified = 1 AND used = 0 AND datetime(expires_at) > datetime('now')
            ORDER BY id DESC LIMIT 1
        """;
        return tursoClient.queryOne(sql, List.of(email.trim(), resetTokenHash)).map(this::mapRowToPasswordReset);
    }

    public void markUsed(Long id) {
        String sql = "UPDATE password_resets SET used = 1 WHERE id = ?";
        tursoClient.update(sql, List.of(id));
    }

    public void markAllUsedForEmail(String email) {
        String sql = "UPDATE password_resets SET used = 1 WHERE LOWER(email) = LOWER(?)";
        tursoClient.update(sql, List.of(email.trim()));
    }

    private PasswordReset mapRowToPasswordReset(Map<String, Object> row) {
        PasswordReset pr = new PasswordReset();
        if (row.get("id") != null) pr.setId(((Number) row.get("id")).longValue());
        pr.setEmail((String) row.get("email"));
        pr.setTokenHash((String) row.get("token_hash"));
        pr.setResetTokenHash((String) row.get("reset_token_hash"));
        pr.setVerified(row.get("verified") != null && ((Number) row.get("verified")).intValue() == 1);
        pr.setAttempts(row.get("attempts") != null ? ((Number) row.get("attempts")).intValue() : 0);
        pr.setUsed(row.get("used") != null && ((Number) row.get("used")).intValue() == 1);
        pr.setExpiresAt(row.get("expires_at") != null ? row.get("expires_at").toString() : null);
        pr.setVerifiedAt(row.get("verified_at") != null ? row.get("verified_at").toString() : null);
        pr.setCreatedAt(row.get("created_at") != null ? row.get("created_at").toString() : null);
        return pr;
    }
}
