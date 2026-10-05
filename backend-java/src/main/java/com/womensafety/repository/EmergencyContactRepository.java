package com.womensafety.repository;

import com.womensafety.config.TursoClient;
import com.womensafety.model.EmergencyContact;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class EmergencyContactRepository {

    private final TursoClient tursoClient;

    public EmergencyContactRepository(TursoClient tursoClient) {
        this.tursoClient = tursoClient;
    }

    public List<EmergencyContact> findAllActive() {
        String sql = """
            SELECT id, name, description, phone, category, additional_info, display_order, is_active, created_at, updated_at
            FROM emergency_contacts
            WHERE is_active = 1
            ORDER BY display_order ASC, created_at DESC, id DESC
        """;
        return tursoClient.query(sql).stream()
                .map(this::mapRowToEmergencyContact)
                .toList();
    }

    public List<EmergencyContact> findAllAdmin() {
        String sql = """
            SELECT id, name, description, phone, category, additional_info, display_order, is_active, created_at, updated_at
            FROM emergency_contacts
            ORDER BY display_order ASC, created_at DESC, id DESC
        """;
        return tursoClient.query(sql).stream()
                .map(this::mapRowToEmergencyContact)
                .toList();
    }

    public Optional<EmergencyContact> findById(Long id) {
        String sql = """
            SELECT id, name, description, phone, category, additional_info, display_order, is_active, created_at, updated_at
            FROM emergency_contacts
            WHERE id = ?
        """;
        return tursoClient.queryOne(sql, List.of(id)).map(this::mapRowToEmergencyContact);
    }

    public Long insert(String name, String description, String phone, String category, String additionalInfo, int displayOrder, boolean isActive) {
        String sql = """
            INSERT INTO emergency_contacts (name, description, phone, category, additional_info, display_order, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """;
        TursoClient.ExecuteResult res = tursoClient.update(sql, Arrays.asList(
                name,
                description,
                phone,
                category,
                additionalInfo,
                displayOrder,
                isActive ? 1 : 0
        ));
        return res.lastInsertRowid();
    }

    public void update(Long id, String name, String description, String phone, String category, String additionalInfo, int displayOrder, boolean isActive) {
        String sql = """
            UPDATE emergency_contacts
            SET name = ?, description = ?, phone = ?, category = ?, additional_info = ?, display_order = ?, is_active = ?, updated_at = datetime('now')
            WHERE id = ?
        """;
        tursoClient.update(sql, Arrays.asList(
                name,
                description,
                phone,
                category,
                additionalInfo,
                displayOrder,
                isActive ? 1 : 0,
                id
        ));
    }

    public void softDelete(Long id) {
        String sql = "UPDATE emergency_contacts SET is_active = 0, updated_at = datetime('now') WHERE id = ?";
        tursoClient.update(sql, List.of(id));
    }

    public void hardDelete(Long id) {
        String sql = "DELETE FROM emergency_contacts WHERE id = ?";
        tursoClient.update(sql, List.of(id));
    }

    private EmergencyContact mapRowToEmergencyContact(Map<String, Object> row) {
        EmergencyContact contact = new EmergencyContact();
        if (row.get("id") != null) contact.setId(((Number) row.get("id")).longValue());
        contact.setName((String) row.get("name"));
        contact.setDescription((String) row.get("description"));
        contact.setPhone((String) row.get("phone"));
        contact.setCategory((String) row.get("category"));
        contact.setAdditionalInfo((String) row.get("additional_info"));
        if (row.get("display_order") != null) contact.setDisplayOrder(((Number) row.get("display_order")).intValue());
        if (row.get("is_active") != null) {
            Object act = row.get("is_active");
            if (act instanceof Boolean b) contact.setIsActive(b);
            else if (act instanceof Number n) contact.setIsActive(n.intValue() == 1);
            else contact.setIsActive("1".equals(act.toString()) || "true".equalsIgnoreCase(act.toString()));
        }
        contact.setCreatedAt(row.get("created_at") != null ? row.get("created_at").toString() : null);
        contact.setUpdatedAt(row.get("updated_at") != null ? row.get("updated_at").toString() : null);
        return contact;
    }
}
