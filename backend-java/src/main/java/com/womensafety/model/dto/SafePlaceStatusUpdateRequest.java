package com.womensafety.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class SafePlaceStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "^(?i)(accepted|rejected)$", message = "Status must be either 'accepted' or 'rejected'")
    private String status;

    public SafePlaceStatusUpdateRequest() {}

    public SafePlaceStatusUpdateRequest(String status) {
        this.status = status;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
