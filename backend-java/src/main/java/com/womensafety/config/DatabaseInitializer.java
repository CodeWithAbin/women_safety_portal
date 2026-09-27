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
                    photo TEXT NOT NULL,
                    rating INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    submitted_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL
                );
            """);

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

            // 4. Indexes
            tursoClient.update("CREATE INDEX IF NOT EXISTS idx_places_state_district_status ON places (state, district, status);");
            tursoClient.update("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id, is_read);");
            tursoClient.update("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);");

            log.info("Database schema initialized successfully.");
        } catch (Exception e) {
            log.warn("Database initialization notice (schema might already exist): {}", e.getMessage());
        }
    }
}
