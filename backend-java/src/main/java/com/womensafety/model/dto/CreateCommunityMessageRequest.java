package com.womensafety.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateCommunityMessageRequest {

    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 1000, message = "Message cannot exceed 1000 characters")
    private String message;

    @JsonProperty("reply_to_message_id")
    private Long replyToMessageId;

    public CreateCommunityMessageRequest() {}

    public CreateCommunityMessageRequest(String message, Long replyToMessageId) {
        this.message = message;
        this.replyToMessageId = replyToMessageId;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getReplyToMessageId() { return replyToMessageId; }
    public void setReplyToMessageId(Long replyToMessageId) { this.replyToMessageId = replyToMessageId; }
}
