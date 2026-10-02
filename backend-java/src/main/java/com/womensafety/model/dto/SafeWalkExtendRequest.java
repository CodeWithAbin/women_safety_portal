package com.womensafety.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public class SafeWalkExtendRequest {

    @NotNull(message = "Extension minutes is required")
    @JsonProperty("extension_minutes")
    private Integer extensionMinutes;

    public SafeWalkExtendRequest() {}

    public SafeWalkExtendRequest(Integer extensionMinutes) {
        this.extensionMinutes = extensionMinutes;
    }

    public Integer getExtensionMinutes() {
        return extensionMinutes;
    }

    public void setExtensionMinutes(Integer extensionMinutes) {
        this.extensionMinutes = extensionMinutes;
    }
}
