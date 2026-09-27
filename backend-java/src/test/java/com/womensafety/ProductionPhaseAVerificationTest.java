package com.womensafety;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

public class ProductionPhaseAVerificationTest {

    private static final String PROD_URL = "https://womensafetyportalspring-production.up.railway.app";
    private static final String VERCEL_ORIGIN = "https://frontend-eight-xi-91.vercel.app";

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    @DisplayName("Verify Production Spring Boot Health Endpoint")
    void testProductionHealth() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(PROD_URL + "/api/health"))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);

        JsonNode json = mapper.readTree(response.body());
        assertThat(json.get("success").asBoolean()).isTrue();
        assertThat(json.get("message").asText()).isEqualTo("Women Safety Portal API is running");
    }

    @Test
    @DisplayName("Verify Production Phase A: Search, Rating Filter, Sorting, Combined & CORS")
    void testProductionPhaseADiscovery() throws Exception {
        // 1. Register a test user to obtain authentication token
        String testEmail = "phase_a_java_verifier_" + System.currentTimeMillis() + "@example.com";
        String registerPayload = mapper.writeValueAsString(new RegisterPayload(
                "Phase A Java Verifier",
                testEmail,
                "password123",
                "Kerala",
                "Ernakulam",
                "9876543210"
        ));

        HttpRequest regRequest = HttpRequest.newBuilder()
                .uri(URI.create(PROD_URL + "/api/auth/register"))
                .header("Content-Type", "application/json")
                .header("Origin", VERCEL_ORIGIN)
                .POST(HttpRequest.BodyPublishers.ofString(registerPayload))
                .build();

        HttpResponse<String> regResponse = client.send(regRequest, HttpResponse.BodyHandlers.ofString());
        assertThat(regResponse.statusCode()).isEqualTo(201);

        JsonNode regJson = mapper.readTree(regResponse.body());
        assertThat(regJson.get("success").asBoolean()).isTrue();
        String token = regJson.get("token").asText();
        assertThat(token).isNotBlank();

        // 2. Test Existing Place Browsing (Backward Compatibility)
        HttpRequest defaultPlacesReq = HttpRequest.newBuilder()
                .uri(URI.create(PROD_URL + "/api/places"))
                .header("Authorization", "Bearer " + token)
                .header("Origin", VERCEL_ORIGIN)
                .GET()
                .build();

        HttpResponse<String> defaultPlacesRes = client.send(defaultPlacesReq, HttpResponse.BodyHandlers.ofString());
        assertThat(defaultPlacesRes.statusCode()).isEqualTo(200);
        JsonNode defaultPlacesJson = mapper.readTree(defaultPlacesRes.body());
        assertThat(defaultPlacesJson.get("success").asBoolean()).isTrue();
        assertThat(defaultPlacesJson.get("data").isArray()).isTrue();

        // 3. Test Search Parameter (?search=...)
        HttpRequest searchReq = HttpRequest.newBuilder()
                .uri(URI.create(PROD_URL + "/api/places?search=road"))
                .header("Authorization", "Bearer " + token)
                .header("Origin", VERCEL_ORIGIN)
                .GET()
                .build();

        HttpResponse<String> searchRes = client.send(searchReq, HttpResponse.BodyHandlers.ofString());
        assertThat(searchRes.statusCode()).isEqualTo(200);
        JsonNode searchJson = mapper.readTree(searchRes.body());
        assertThat(searchJson.get("success").asBoolean()).isTrue();
        assertThat(searchJson.get("data").isArray()).isTrue();

        // 4. Test Rating Filter (?minRating=...)
        HttpRequest minRatingReq = HttpRequest.newBuilder()
                .uri(URI.create(PROD_URL + "/api/places?minRating=3"))
                .header("Authorization", "Bearer " + token)
                .header("Origin", VERCEL_ORIGIN)
                .GET()
                .build();

        HttpResponse<String> minRatingRes = client.send(minRatingReq, HttpResponse.BodyHandlers.ofString());
        assertThat(minRatingRes.statusCode()).isEqualTo(200);
        JsonNode minRatingJson = mapper.readTree(minRatingRes.body());
        assertThat(minRatingJson.get("success").asBoolean()).isTrue();
        for (JsonNode place : minRatingJson.get("data")) {
            assertThat(place.get("rating").asInt()).isGreaterThanOrEqualTo(3);
        }

        // 5. Test Sorting (?sort=rating_desc, rating_asc, newest)
        HttpRequest sortDescReq = HttpRequest.newBuilder()
                .uri(URI.create(PROD_URL + "/api/places?sort=rating_desc"))
                .header("Authorization", "Bearer " + token)
                .header("Origin", VERCEL_ORIGIN)
                .GET()
                .build();

        HttpResponse<String> sortDescRes = client.send(sortDescReq, HttpResponse.BodyHandlers.ofString());
        assertThat(sortDescRes.statusCode()).isEqualTo(200);

        HttpRequest sortAscReq = HttpRequest.newBuilder()
                .uri(URI.create(PROD_URL + "/api/places?sort=rating_asc"))
                .header("Authorization", "Bearer " + token)
                .header("Origin", VERCEL_ORIGIN)
                .GET()
                .build();

        HttpResponse<String> sortAscRes = client.send(sortAscReq, HttpResponse.BodyHandlers.ofString());
        assertThat(sortAscRes.statusCode()).isEqualTo(200);

        HttpRequest sortNewestReq = HttpRequest.newBuilder()
                .uri(URI.create(PROD_URL + "/api/places?sort=newest"))
                .header("Authorization", "Bearer " + token)
                .header("Origin", VERCEL_ORIGIN)
                .GET()
                .build();

        HttpResponse<String> sortNewestRes = client.send(sortNewestReq, HttpResponse.BodyHandlers.ofString());
        assertThat(sortNewestRes.statusCode()).isEqualTo(200);

        // 6. Test Combined Filters (state + district + search + minRating + sort)
        HttpRequest combinedReq = HttpRequest.newBuilder()
                .uri(URI.create(PROD_URL + "/api/places?state=Kerala&district=Ernakulam&search=a&minRating=2&sort=rating_desc"))
                .header("Authorization", "Bearer " + token)
                .header("Origin", VERCEL_ORIGIN)
                .GET()
                .build();

        HttpResponse<String> combinedRes = client.send(combinedReq, HttpResponse.BodyHandlers.ofString());
        assertThat(combinedRes.statusCode()).isEqualTo(200);
        JsonNode combinedJson = mapper.readTree(combinedRes.body());
        assertThat(combinedJson.get("success").asBoolean()).isTrue();
        for (JsonNode place : combinedJson.get("data")) {
            assertThat(place.get("state").asText().equalsIgnoreCase("Kerala")).isTrue();
            assertThat(place.get("district").asText().equalsIgnoreCase("Ernakulam")).isTrue();
            assertThat(place.get("rating").asInt()).isGreaterThanOrEqualTo(2);
        }

        // 7. Test Validation (Invalid minRating & Invalid sort)
        HttpRequest invalidRatingReq = HttpRequest.newBuilder()
                .uri(URI.create(PROD_URL + "/api/places?minRating=6"))
                .header("Authorization", "Bearer " + token)
                .header("Origin", VERCEL_ORIGIN)
                .GET()
                .build();

        HttpResponse<String> invalidRatingRes = client.send(invalidRatingReq, HttpResponse.BodyHandlers.ofString());
        assertThat(invalidRatingRes.statusCode()).isEqualTo(400);

        HttpRequest invalidSortReq = HttpRequest.newBuilder()
                .uri(URI.create(PROD_URL + "/api/places?sort=unsupported_order"))
                .header("Authorization", "Bearer " + token)
                .header("Origin", VERCEL_ORIGIN)
                .GET()
                .build();

        HttpResponse<String> invalidSortRes = client.send(invalidSortReq, HttpResponse.BodyHandlers.ofString());
        assertThat(invalidSortRes.statusCode()).isEqualTo(400);

        // 8. Test CORS Preflight from Vercel Origin
        HttpRequest corsReq = HttpRequest.newBuilder()
                .uri(URI.create(PROD_URL + "/api/places"))
                .header("Origin", VERCEL_ORIGIN)
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "Authorization, Content-Type")
                .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                .build();

        HttpResponse<String> corsRes = client.send(corsReq, HttpResponse.BodyHandlers.ofString());
        String allowOrigin = corsRes.headers().firstValue("access-control-allow-origin").orElse("");
        assertThat(allowOrigin.equals(VERCEL_ORIGIN) || allowOrigin.equals("*")).isTrue();
    }

    private static class RegisterPayload {
        public String name;
        public String email;
        public String password;
        public String state;
        public String district;
        public String phone;

        public RegisterPayload(String name, String email, String password, String state, String district, String phone) {
            this.name = name;
            this.email = email;
            this.password = password;
            this.state = state;
            this.district = district;
            this.phone = phone;
        }
    }
}
