package com.womensafety.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.turso")
public class TursoConfig {
    private String url = "";
    private String token = "";

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public boolean isRemoteTurso() {
        return url != null && (url.startsWith("libsql://") || url.startsWith("https://") || url.startsWith("http://"));
    }

    public void validateEnvironment() {
        boolean isProduction = "production".equalsIgnoreCase(System.getenv("NODE_ENV")) ||
                               "production".equalsIgnoreCase(System.getenv("ENVIRONMENT")) ||
                               System.getenv("RAILWAY_ENVIRONMENT") != null ||
                               System.getenv("RAILWAY_PROJECT_ID") != null;

        if (isProduction && !isRemoteTurso()) {
            throw new IllegalStateException("CRITICAL CONFIGURATION ERROR: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be provided in production environment. Silently falling back to local SQLite in production is disabled for safety.");
        }
    }
}
