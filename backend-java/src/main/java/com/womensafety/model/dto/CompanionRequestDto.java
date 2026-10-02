package com.womensafety.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public class CompanionRequestDto {

    @JsonProperty("recipient_id")
    private Long recipientId;

    @JsonProperty("recipient_email")
    private String recipientEmail;

    public CompanionRequestDto() {}

    public CompanionRequestDto(Long recipientId, String recipientEmail) {
        this.recipientId = recipientId;
        this.recipientEmail = recipientEmail;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }
}
