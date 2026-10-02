package com.womensafety.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    private final TursoClient tursoClient;

    public DatabaseInitializer(TursoClient tursoClient) {
        this.tursoClient = tursoClient;
    }

    @PostConstruct
    public void initialize() {
        try {
            log.info("Initializing database schema if not present...");

            // 1. Users Table
            tursoClient.update("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    state TEXT NOT NULL,
                    district TEXT NOT NULL,
                    phone TEXT,
                    role TEXT NOT NULL DEFAULT 'user',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            """);

            // 2. Places Table
            tursoClient.update("""
                CREATE TABLE IF NOT EXISTS places (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    address TEXT NOT NULL,
                    state TEXT NOT NULL,
                    district TEXT NOT NULL,
                    latitude REAL,
                    longitude REAL,
                    photo TEXT NOT NULL,
                    rating INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    resolved INTEGER NOT NULL DEFAULT 0,
                    resolved_at DATETIME,
                    submitted_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL
                );
            """);

            // Migration for existing tables
            try {
                tursoClient.update("ALTER TABLE places ADD COLUMN resolved INTEGER NOT NULL DEFAULT 0;");
            } catch (Exception ignored) {}
            try {
                tursoClient.update("ALTER TABLE places ADD COLUMN resolved_at DATETIME;");
            } catch (Exception ignored) {}
            try {
                tursoClient.update("ALTER TABLE places ADD COLUMN latitude REAL;");
            } catch (Exception ignored) {}
            try {
                tursoClient.update("ALTER TABLE places ADD COLUMN longitude REAL;");
            } catch (Exception ignored) {}

            // 3. Notifications Table
            tursoClient.update("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    place_id INTEGER,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    type TEXT NOT NULL DEFAULT 'status_update',
                    is_read INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE SET NULL
                );
            """);

            // 4. Place Ratings Table
            tursoClient.update("""
                CREATE TABLE IF NOT EXISTS place_ratings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    place_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    rating INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE(place_id, user_id)
                );
            """);

            // 5. Companion Relationships Table (Phase 6A)
            tursoClient.update("""
                CREATE TABLE IF NOT EXISTS companion_relationships (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    requester_id INTEGER NOT NULL,
                    recipient_id INTEGER NOT NULL,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE(requester_id, recipient_id)
                );
            """);

            // 6. Safe Walk Journeys Table (Phase 6A)
            tursoClient.update("""
                CREATE TABLE IF NOT EXISTS safe_walks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    companion_id INTEGER NOT NULL,
                    start_latitude REAL,
                    start_longitude REAL,
                    destination TEXT NOT NULL,
                    expected_arrival DATETIME,
                    status TEXT NOT NULL DEFAULT 'ACTIVE',
                    last_latitude REAL,
                    last_longitude REAL,
                    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    completed_at DATETIME,
                    cancelled_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (companion_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """);

            // 7. Indexes
            tursoClient.update("CREATE INDEX IF NOT EXISTS idx_places_state_district_status ON places (state, district, status);");
            tursoClient.update("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id, is_read);");
            tursoClient.update("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);");
            tursoClient.update("CREATE INDEX IF NOT EXISTS idx_place_ratings_place_user ON place_ratings (place_id, user_id);");
            tursoClient.update("CREATE INDEX IF NOT EXISTS idx_companion_requester ON companion_relationships (requester_id, status);");
            tursoClient.update("CREATE INDEX IF NOT EXISTS idx_companion_recipient ON companion_relationships (recipient_id, status);");
            tursoClient.update("CREATE INDEX IF NOT EXISTS idx_safewalks_user_status ON safe_walks (user_id, status);");
            tursoClient.update("CREATE INDEX IF NOT EXISTS idx_safewalks_companion_status ON safe_walks (companion_id, status);");

            // Populate initial ratings from existing places if not already seeded
            tursoClient.update("INSERT OR IGNORE INTO place_ratings (place_id, user_id, rating) SELECT id, submitted_by, rating FROM places WHERE submitted_by IS NOT NULL;");

            log.info("Database schema initialized successfully.");
        } catch (Exception e) {
            log.warn("Database initialization notice (schema might already exist): {}", e.getMessage());
        }
    }
}
