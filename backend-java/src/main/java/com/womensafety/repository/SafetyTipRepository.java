package com.womensafety.repository;

import com.womensafety.config.TursoClient;
import com.womensafety.model.SafetyTip;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class SafetyTipRepository {

    private final TursoClient tursoClient;

    public SafetyTipRepository(TursoClient tursoClient) {
        this.tursoClient = tursoClient;
    }

    public List<SafetyTip> findAllActive() {
        String sql = """
            SELECT id, title, content, category, display_order, is_active, created_at, updated_at
            FROM safety_tips
            WHERE is_active = 1
            ORDER BY display_order ASC, created_at DESC, id DESC
        """;
        return tursoClient.query(sql).stream()
                .map(this::mapRowToSafetyTip)
                .toList();
    }

    public List<SafetyTip> findAllAdmin() {
        String sql = """
            SELECT id, title, content, category, display_order, is_active, created_at, updated_at
            FROM safety_tips
            ORDER BY display_order ASC, created_at DESC, id DESC
        """;
        return tursoClient.query(sql).stream()
                .map(this::mapRowToSafetyTip)
                .toList();
    }

    public Optional<SafetyTip> findById(Long id) {
        String sql = """
            SELECT id, title, content, category, display_order, is_active, created_at, updated_at
            FROM safety_tips
            WHERE id = ?
        """;
        return tursoClient.queryOne(sql, List.of(id)).map(this::mapRowToSafetyTip);
    }

    public Long insert(String title, String content, String category, int displayOrder, boolean isActive) {
        String sql = """
            INSERT INTO safety_tips (title, content, category, display_order, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """;
        TursoClient.ExecuteResult res = tursoClient.update(sql, Arrays.asList(
                title,
                content,
                category,
                displayOrder,
                isActive ? 1 : 0
        ));
        return res.lastInsertRowid();
    }

    public void update(Long id, String title, String content, String category, int displayOrder, boolean isActive) {
        String sql = """
            UPDATE safety_tips
            SET title = ?, content = ?, category = ?, display_order = ?, is_active = ?, updated_at = datetime('now')
            WHERE id = ?
        """;
        tursoClient.update(sql, Arrays.asList(
                title,
                content,
                category,
                displayOrder,
                isActive ? 1 : 0,
                id
        ));
    }

    public void softDelete(Long id) {
        String sql = "UPDATE safety_tips SET is_active = 0, updated_at = datetime('now') WHERE id = ?";
        tursoClient.update(sql, List.of(id));
    }

    public void hardDelete(Long id) {
        String sql = "DELETE FROM safety_tips WHERE id = ?";
        tursoClient.update(sql, List.of(id));
    }

    private SafetyTip mapRowToSafetyTip(Map<String, Object> row) {
        SafetyTip tip = new SafetyTip();
        if (row.get("id") != null) tip.setId(((Number) row.get("id")).longValue());
        tip.setTitle((String) row.get("title"));
        tip.setContent((String) row.get("content"));
        tip.setCategory((String) row.get("category"));
        if (row.get("display_order") != null) tip.setDisplayOrder(((Number) row.get("display_order")).intValue());
        if (row.get("is_active") != null) {
            Object act = row.get("is_active");
            if (act instanceof Boolean b) tip.setIsActive(b);
            else if (act instanceof Number n) tip.setIsActive(n.intValue() == 1);
            else tip.setIsActive("1".equals(act.toString()) || "true".equalsIgnoreCase(act.toString()));
        }
        tip.setCreatedAt(row.get("created_at") != null ? row.get("created_at").toString() : null);
        tip.setUpdatedAt(row.get("updated_at") != null ? row.get("updated_at").toString() : null);
        return tip;
    }
}
