package com.womensafety.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.*;
import java.time.Duration;
import java.util.*;

@Component
public class TursoClient {

    private static final Logger log = LoggerFactory.getLogger(TursoClient.class);

    private final TursoConfig config;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public record ExecuteResult(int affectedRows, Long lastInsertRowid) {}

    public record Statement(String sql, List<Object> args) {
        public Statement(String sql) {
            this(sql, Collections.emptyList());
        }
    }

    public TursoClient(TursoConfig config, ObjectMapper objectMapper) {
        this.config = config;
        config.validateEnvironment();
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Executes a SELECT query and returns all matching rows as a list of Maps.
     */
    public List<Map<String, Object>> query(String sql, List<Object> args) {
        if (config.isRemoteTurso()) {
            return executeRemoteQuery(sql, args);
        } else {
            return executeLocalQuery(sql, args);
        }
    }

    public List<Map<String, Object>> query(String sql) {
        return query(sql, Collections.emptyList());
    }

    /**
     * Executes a SELECT query expecting at most one row.
     */
    public Optional<Map<String, Object>> queryOne(String sql, List<Object> args) {
        List<Map<String, Object>> results = query(sql, args);
        if (results.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(results.get(0));
    }

    public Optional<Map<String, Object>> queryOne(String sql) {
        return queryOne(sql, Collections.emptyList());
    }

    /**
     * Executes an INSERT, UPDATE, or DELETE statement.
     */
    public ExecuteResult update(String sql, List<Object> args) {
        if (config.isRemoteTurso()) {
            return executeRemoteUpdate(sql, args);
        } else {
            return executeLocalUpdate(sql, args);
        }
    }

    public ExecuteResult update(String sql) {
        return update(sql, Collections.emptyList());
    }

    /**
     * Executes multiple statements in an atomic batch.
     */
    public void executeBatch(List<Statement> statements) {
        if (config.isRemoteTurso()) {
            executeRemoteBatch(statements);
        } else {
            executeLocalBatch(statements);
        }
    }

    // ==========================================
    // Remote Turso HTTP Pipeline Implementation
    // ==========================================

    private String getPipelineEndpoint() {
        String url = config.getUrl().trim();
        if (url.startsWith("libsql://")) {
            url = "https://" + url.substring("libsql://".length());
        }
        if (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url + "/v2/pipeline";
    }

    private ObjectNode createStmtNode(String sql, List<Object> args) {
        ObjectNode stmt = objectMapper.createObjectNode();
        stmt.put("sql", sql);
        ArrayNode argsArray = stmt.putArray("args");
        if (args != null) {
            for (Object arg : args) {
                argsArray.add(convertArgToJson(arg));
            }
        }
        return stmt;
    }

    private ObjectNode convertArgToJson(Object arg) {
        ObjectNode node = objectMapper.createObjectNode();
        if (arg == null) {
            node.put("type", "null");
        } else if (arg instanceof Integer || arg instanceof Long || arg instanceof Short || arg instanceof Byte) {
            node.put("type", "integer");
            node.put("value", String.valueOf(arg));
        } else if (arg instanceof Double || arg instanceof Float) {
            node.put("type", "float");
            node.put("value", ((Number) arg).doubleValue());
        } else if (arg instanceof Boolean) {
            node.put("type", "integer");
            node.put("value", (Boolean) arg ? "1" : "0");
        } else {
            node.put("type", "text");
            node.put("value", arg.toString());
        }
        return node;
    }

    private List<Map<String, Object>> executeRemoteQuery(String sql, List<Object> args) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            ArrayNode requests = root.putArray("requests");

            ObjectNode execReq = requests.addObject();
            execReq.put("type", "execute");
            execReq.set("stmt", createStmtNode(sql, args));

            ObjectNode closeReq = requests.addObject();
            closeReq.put("type", "close");

            String jsonPayload = objectMapper.writeValueAsString(root);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(getPipelineEndpoint()))
                    .header("Authorization", "Bearer " + config.getToken())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Turso HTTP request failed with status " + response.statusCode() + ": " + response.body());
            }

            JsonNode respJson = objectMapper.readTree(response.body());
            JsonNode results = respJson.get("results");
            if (results == null || !results.isArray() || results.isEmpty()) {
                return Collections.emptyList();
            }

            JsonNode firstResult = results.get(0);
            if (firstResult.has("type") && "error".equals(firstResult.get("type").asText())) {
                String errMsg = firstResult.has("error") ? firstResult.get("error").get("message").asText() : "Unknown Turso error";
                throw new RuntimeException("Turso query error: " + errMsg);
            }

            JsonNode executeResult = firstResult.path("response").path("result");
            if (executeResult.isMissingNode()) {
                return Collections.emptyList();
            }

            JsonNode cols = executeResult.get("cols");
            JsonNode rows = executeResult.get("rows");

            List<String> colNames = new ArrayList<>();
            if (cols != null && cols.isArray()) {
                for (JsonNode col : cols) {
                    colNames.add(col.get("name").asText());
                }
            }

            List<Map<String, Object>> rowsList = new ArrayList<>();
            if (rows != null && rows.isArray()) {
                for (JsonNode rowNode : rows) {
                    Map<String, Object> rowMap = new LinkedHashMap<>();
                    for (int i = 0; i < colNames.size() && i < rowNode.size(); i++) {
                        String colName = colNames.get(i);
                        JsonNode cell = rowNode.get(i);
                        rowMap.put(colName, parseTursoCell(cell));
                    }
                    rowsList.add(rowMap);
                }
            }

            return rowsList;
        } catch (Exception e) {
            log.error("Remote Turso query execution failed: {}", e.getMessage());
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }
    }

    private ExecuteResult executeRemoteUpdate(String sql, List<Object> args) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            ArrayNode requests = root.putArray("requests");

            ObjectNode execReq = requests.addObject();
            execReq.put("type", "execute");
            execReq.set("stmt", createStmtNode(sql, args));

            ObjectNode closeReq = requests.addObject();
            closeReq.put("type", "close");

            String jsonPayload = objectMapper.writeValueAsString(root);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(getPipelineEndpoint()))
                    .header("Authorization", "Bearer " + config.getToken())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Turso HTTP update failed with status " + response.statusCode() + ": " + response.body());
            }

            JsonNode respJson = objectMapper.readTree(response.body());
            JsonNode results = respJson.get("results");
            if (results == null || !results.isArray() || results.isEmpty()) {
                return new ExecuteResult(0, null);
            }

            JsonNode firstResult = results.get(0);
            if (firstResult.has("type") && "error".equals(firstResult.get("type").asText())) {
                String errMsg = firstResult.has("error") ? firstResult.get("error").get("message").asText() : "Unknown Turso error";
                throw new RuntimeException("Turso update error: " + errMsg);
            }

            JsonNode executeResult = firstResult.path("response").path("result");
            int affected = executeResult.path("affected_row_count").asInt(0);
            Long lastId = null;
            if (executeResult.hasNonNull("last_insert_rowid")) {
                try {
                    lastId = Long.parseLong(executeResult.get("last_insert_rowid").asText());
                } catch (NumberFormatException ignored) {}
            }

            return new ExecuteResult(affected, lastId);
        } catch (Exception e) {
            log.error("Remote Turso update failed: {}", e.getMessage());
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }
    }

    private void executeRemoteBatch(List<Statement> statements) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            ArrayNode requests = root.putArray("requests");

            for (Statement stmt : statements) {
                ObjectNode execReq = requests.addObject();
                execReq.put("type", "execute");
                execReq.set("stmt", createStmtNode(stmt.sql(), stmt.args()));
            }

            ObjectNode closeReq = requests.addObject();
            closeReq.put("type", "close");

            String jsonPayload = objectMapper.writeValueAsString(root);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(getPipelineEndpoint()))
                    .header("Authorization", "Bearer " + config.getToken())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Turso HTTP batch failed with status " + response.statusCode() + ": " + response.body());
            }

            JsonNode respJson = objectMapper.readTree(response.body());
            JsonNode results = respJson.get("results");
            if (results != null && results.isArray()) {
                for (JsonNode resNode : results) {
                    if (resNode.has("type") && "error".equals(resNode.get("type").asText())) {
                        String errMsg = resNode.has("error") ? resNode.get("error").get("message").asText() : "Unknown Turso error";
                        throw new RuntimeException("Turso batch error: " + errMsg);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Remote Turso batch execution failed: {}", e.getMessage());
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }
    }

    private Object parseTursoCell(JsonNode cell) {
        if (cell == null || cell.isNull()) {
            return null;
        }
        String type = cell.path("type").asText("null");
        return switch (type) {
            case "null" -> null;
            case "integer" -> cell.path("value").asLong();
            case "float" -> cell.path("value").asDouble();
            case "text" -> cell.path("value").asText();
            case "blob" -> cell.path("base64").asText();
            default -> cell.path("value").asText();
        };
    }

    // ==========================================
    // Local SQLite Fallback Implementation
    // ==========================================

    private Connection getLocalConnection() throws SQLException {
        String dbPath = config.getUrl();
        if (dbPath == null || dbPath.trim().isEmpty()) {
            dbPath = "safety_portal.db";
        } else if (dbPath.startsWith("file:")) {
            dbPath = dbPath.substring(5);
        }
        String jdbcUrl = "jdbc:sqlite:" + dbPath;
        Connection conn = DriverManager.getConnection(jdbcUrl);
        try (java.sql.Statement pragma = conn.createStatement()) {
            pragma.execute("PRAGMA foreign_keys = ON;");
        }
        return conn;
    }

    private List<Map<String, Object>> executeLocalQuery(String sql, List<Object> args) {
        try (Connection conn = getLocalConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setStatementArgs(ps, args);
            try (ResultSet rs = ps.executeQuery()) {
                ResultSetMetaData meta = rs.getMetaData();
                int colCount = meta.getColumnCount();
                List<Map<String, Object>> rows = new ArrayList<>();
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    for (int i = 1; i <= colCount; i++) {
                        String colName = meta.getColumnLabel(i);
                        map.put(colName, rs.getObject(i));
                    }
                    rows.add(map);
                }
                return rows;
            }
        } catch (SQLException e) {
            log.error("Local SQLite query failed: {}", e.getMessage());
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }
    }

    private ExecuteResult executeLocalUpdate(String sql, List<Object> args) {
        try (Connection conn = getLocalConnection();
             PreparedStatement ps = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
            setStatementArgs(ps, args);
            int affected = ps.executeUpdate();
            Long lastId = null;
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    lastId = rs.getLong(1);
                }
            }
            return new ExecuteResult(affected, lastId);
        } catch (SQLException e) {
            log.error("Local SQLite update failed: {}", e.getMessage());
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }
    }

    private void executeLocalBatch(List<Statement> statements) {
        try (Connection conn = getLocalConnection()) {
            conn.setAutoCommit(false);
            try {
                for (Statement stmt : statements) {
                    try (PreparedStatement ps = conn.prepareStatement(stmt.sql())) {
                        setStatementArgs(ps, stmt.args());
                        ps.execute();
                    }
                }
                conn.commit();
            } catch (Exception e) {
                conn.rollback();
                throw e;
            }
        } catch (SQLException e) {
            log.error("Local SQLite batch failed: {}", e.getMessage());
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }
    }

    private void setStatementArgs(PreparedStatement ps, List<Object> args) throws SQLException {
        if (args == null) return;
        for (int i = 0; i < args.size(); i++) {
            ps.setObject(i + 1, args.get(i));
        }
    }
}
