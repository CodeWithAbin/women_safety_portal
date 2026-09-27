package com.womensafety.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@Order(1)
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final TursoClient tursoClient;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    public AdminSeeder(TursoClient tursoClient, PasswordEncoder passwordEncoder) {
        this.tursoClient = tursoClient;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (adminEmail == null || adminEmail.trim().isEmpty() ||
            adminPassword == null || adminPassword.trim().isEmpty()) {
            log.warn("ADMIN_EMAIL and ADMIN_PASSWORD must be configured in environment variables.");
            return;
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();

        try {
            Optional<Map<String, Object>> existingAdmin = tursoClient.queryOne(
                    "SELECT id, email, password_hash, role FROM users WHERE LOWER(email) = ?",
                    List.of(normalizedEmail)
            );

            if (existingAdmin.isEmpty()) {
                String hash = passwordEncoder.encode(adminPassword);
                tursoClient.update(
                        "INSERT INTO users (name, email, password_hash, state, district, role) VALUES (?, ?, ?, ?, ?, ?)",
                        List.of("Administrator", normalizedEmail, hash, "Kerala", "Ernakulam", "admin")
                );
                log.info("Admin account initialized: {}", normalizedEmail);
            } else {
                Map<String, Object> admin = existingAdmin.get();
                String currentHash = (String) admin.get("password_hash");
                String currentRole = (String) admin.get("role");
                Object adminId = admin.get("id");

                boolean passwordMatches = currentHash != null && passwordEncoder.matches(adminPassword, currentHash);
                if (!passwordMatches || !"admin".equals(currentRole)) {
                    String newHash = passwordEncoder.encode(adminPassword);
                    tursoClient.update(
                            "UPDATE users SET password_hash = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                            List.of(newHash, "admin", adminId)
                    );
                    log.info("Admin account credentials/role synchronized for: {}", normalizedEmail);
                } else {
                    log.info("Admin account verified: {}", normalizedEmail);
                }
            }
        } catch (Exception e) {
            log.error("Error during admin initialization: {}", e.getMessage());
        }
    }
}
