package com.womensafety;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication
public class WomenSafetyPortalApplication {

    public static void main(String[] args) {
        loadDotEnvIfPresent();
        SpringApplication.run(WomenSafetyPortalApplication.class, args);
    }

    private static void loadDotEnvIfPresent() {
        String[] candidatePaths = {
            ".env",
            "../.env",
            "backend-java/.env",
            "../backend-java/.env"
        };

        for (String candidate : candidatePaths) {
            Path path = Paths.get(candidate);
            if (Files.exists(path) && !Files.isDirectory(path)) {
                try {
                    List<String> lines = Files.readAllLines(path);
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int equalsIdx = line.indexOf('=');
                        if (equalsIdx > 0) {
                            String key = line.substring(0, equalsIdx).trim();
                            String value = line.substring(equalsIdx + 1).trim();
                            // strip quotes if present
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    break;
                } catch (Exception ignored) {
                }
            }
        }
    }
}
