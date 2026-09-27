package com.womensafety;

import com.womensafety.config.TursoClient;
import com.womensafety.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WomenSafetyPortalApplicationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private TursoClient tursoClient;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void contextLoads() {
        assertThat(tursoClient).isNotNull();
    }

    @Test
    void testHealthEndpoint() {
        String url = "http://localhost:" + port + "/api/health";
        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("success")).isEqualTo(true);
        assertThat(response.getBody().get("message")).isEqualTo("Women Safety Portal API is running");
    }

    @Test
    void testPlacesSearchFilterAndSort() {
        String token = jwtTokenProvider.generateToken(1L, "testuser@example.com", "user");
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String baseUrl = "http://localhost:" + port + "/api/places";

        // 1. Basic authenticated get places
        ResponseEntity<Map> defaultRes = restTemplate.exchange(baseUrl, HttpMethod.GET, entity, Map.class);
        assertThat(defaultRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(defaultRes.getBody()).isNotNull();
        assertThat(defaultRes.getBody().get("success")).isEqualTo(true);
        assertThat(defaultRes.getBody().get("data")).isInstanceOf(List.class);

        // 2. Search parameter
        ResponseEntity<Map> searchRes = restTemplate.exchange(baseUrl + "?search=street", HttpMethod.GET, entity, Map.class);
        assertThat(searchRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(searchRes.getBody().get("success")).isEqualTo(true);

        // 3. MinRating parameter
        ResponseEntity<Map> minRatingRes = restTemplate.exchange(baseUrl + "?minRating=3", HttpMethod.GET, entity, Map.class);
        assertThat(minRatingRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(minRatingRes.getBody().get("success")).isEqualTo(true);

        // 4. Sort parameters: rating_desc, rating_asc, newest
        ResponseEntity<Map> sortDescRes = restTemplate.exchange(baseUrl + "?sort=rating_desc", HttpMethod.GET, entity, Map.class);
        assertThat(sortDescRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> sortAscRes = restTemplate.exchange(baseUrl + "?sort=rating_asc", HttpMethod.GET, entity, Map.class);
        assertThat(sortAscRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> sortNewestRes = restTemplate.exchange(baseUrl + "?sort=newest", HttpMethod.GET, entity, Map.class);
        assertThat(sortNewestRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        // 5. Combined parameters: state, district, search, minRating, sort
        ResponseEntity<Map> combinedRes = restTemplate.exchange(
                baseUrl + "?state=Kerala&district=Ernakulam&search=road&minRating=2&sort=rating_desc",
                HttpMethod.GET,
                entity,
                Map.class
        );
        assertThat(combinedRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(combinedRes.getBody().get("success")).isEqualTo(true);

        // 6. Validation: Invalid minRating (< 1 or > 5)
        ResponseEntity<Map> invalidRatingRes = restTemplate.exchange(baseUrl + "?minRating=6", HttpMethod.GET, entity, Map.class);
        assertThat(invalidRatingRes.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(invalidRatingRes.getBody().get("success")).isEqualTo(false);

        // 7. Validation: Invalid sort value
        ResponseEntity<Map> invalidSortRes = restTemplate.exchange(baseUrl + "?sort=invalid_order", HttpMethod.GET, entity, Map.class);
        assertThat(invalidSortRes.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(invalidSortRes.getBody().get("success")).isEqualTo(false);
    }
}
