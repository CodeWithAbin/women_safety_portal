package com.womensafety.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SafeWalkCreateRequest {

    @NotNull(message = "Companion ID is required")
    @JsonProperty("companion_id")
    private Long companionId;

    @JsonProperty("start_latitude")
    private Double startLatitude;

    @JsonProperty("start_longitude")
    private Double startLongitude;

    @NotBlank(message = "Destination is required")
    private String destination;

    @JsonProperty("expected_arrival")
    private String expectedArrival;

    @JsonProperty("expected_duration_minutes")
    private Integer expectedDurationMinutes;

    public SafeWalkCreateRequest() {}

    public Long getCompanionId() {
        return companionId;
    }

    public void setCompanionId(Long companionId) {
        this.companionId = companionId;
    }

    public Double getStartLatitude() {
        return startLatitude;
    }

    public void setStartLatitude(Double startLatitude) {
        this.startLatitude = startLatitude;
    }

    public Double getStartLongitude() {
        return startLongitude;
    }

    public void setStartLongitude(Double startLongitude) {
        this.startLongitude = startLongitude;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getExpectedArrival() {
        return expectedArrival;
    }

    public void setExpectedArrival(String expectedArrival) {
        this.expectedArrival = expectedArrival;
    }

    public Integer getExpectedDurationMinutes() {
        return expectedDurationMinutes;
    }

    public void setExpectedDurationMinutes(Integer expectedDurationMinutes) {
        this.expectedDurationMinutes = expectedDurationMinutes;
    }
}
