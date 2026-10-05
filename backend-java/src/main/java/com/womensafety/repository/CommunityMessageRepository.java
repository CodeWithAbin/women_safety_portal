package com.womensafety.repository;

import com.womensafety.config.TursoClient;
import com.womensafety.model.CommunityMessage;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class CommunityMessageRepository {

    private final TursoClient tursoClient;

    public CommunityMessageRepository(TursoClient tursoClient) {
        this.tursoClient = tursoClient;
    }

    public List<CommunityMessage> findRecentMessages(int limit) {
        String sql = """
            SELECT 
                cm.id,
                cm.user_id,
                u.name AS user_name,
                u.role AS user_role,
                u.state AS user_state,
                u.district AS user_district,
                cm.message,
                cm.reply_to_message_id,
                ru.name AS reply_to_user_name,
                rm.message AS reply_to_snippet,
                cm.is_deleted,
                cm.created_at,
                cm.updated_at
            FROM community_messages cm
            JOIN users u ON cm.user_id = u.id
            LEFT JOIN community_messages rm ON cm.reply_to_message_id = rm.id
            LEFT JOIN users ru ON rm.user_id = ru.id
            WHERE cm.is_deleted = 0
            ORDER BY cm.created_at DESC, cm.id DESC
            LIMIT ?
        """;

        List<Map<String, Object>> rows = tursoClient.query(sql, List.of(limit));
        List<CommunityMessage> list = new ArrayList<>(rows.stream().map(this::mapRowToCommunityMessage).toList());
        // Reverse so that the client receives them chronologically (oldest to newest)
        Collections.reverse(list);
        return list;
    }

    public Optional<CommunityMessage> findById(Long id) {
        String sql = """
            SELECT 
                cm.id,
                cm.user_id,
                u.name AS user_name,
                u.role AS user_role,
                u.state AS user_state,
                u.district AS user_district,
                cm.message,
                cm.reply_to_message_id,
                ru.name AS reply_to_user_name,
                rm.message AS reply_to_snippet,
                cm.is_deleted,
                cm.created_at,
                cm.updated_at
            FROM community_messages cm
            JOIN users u ON cm.user_id = u.id
            LEFT JOIN community_messages rm ON cm.reply_to_message_id = rm.id
            LEFT JOIN users ru ON rm.user_id = ru.id
            WHERE cm.id = ?
        """;

        return tursoClient.queryOne(sql, List.of(id)).map(this::mapRowToCommunityMessage);
    }

    public Long insert(Long userId, String message, Long replyToMessageId) {
        String sql = """
            INSERT INTO community_messages (user_id, message, reply_to_message_id, is_deleted, created_at, updated_at)
            VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """;
        TursoClient.ExecuteResult res = tursoClient.update(sql, Arrays.asList(userId, message, replyToMessageId));
        return res.lastInsertRowid();
    }

    public void softDelete(Long id) {
        String sql = "UPDATE community_messages SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        tursoClient.update(sql, List.of(id));
    }

    private CommunityMessage mapRowToCommunityMessage(Map<String, Object> row) {
        CommunityMessage m = new CommunityMessage();
        if (row.get("id") != null) m.setId(((Number) row.get("id")).longValue());
        if (row.get("user_id") != null) m.setUserId(((Number) row.get("user_id")).longValue());
        m.setUserName((String) row.get("user_name"));
        m.setUserRole((String) row.get("user_role"));
        m.setUserState((String) row.get("user_state"));
        m.setUserDistrict((String) row.get("user_district"));
        m.setMessage((String) row.get("message"));

        if (row.get("reply_to_message_id") != null) {
            m.setReplyToMessageId(((Number) row.get("reply_to_message_id")).longValue());
        }
        m.setReplyToUserName((String) row.get("reply_to_user_name"));
        
        String snippet = (String) row.get("reply_to_snippet");
        if (snippet != null && snippet.length() > 80) {
            snippet = snippet.substring(0, 77) + "...";
        }
        m.setReplyToSnippet(snippet);

        if (row.get("is_deleted") != null) {
            m.setIsDeleted(((Number) row.get("is_deleted")).intValue());
        }
        m.setCreatedAt(row.get("created_at") != null ? row.get("created_at").toString() : null);
        m.setUpdatedAt(row.get("updated_at") != null ? row.get("updated_at").toString() : null);
        return m;
    }
}
