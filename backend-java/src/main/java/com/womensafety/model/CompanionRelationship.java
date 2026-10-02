package com.womensafety.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompanionRelationship {
    private Long id;

    @JsonProperty("requester_id")
    private Long requesterId;

    @JsonProperty("recipient_id")
    private Long recipientId;

    private String status; // PENDING, ACCEPTED, REJECTED

    @JsonProperty("created_at")
    private String createdAt;

    @JsonProperty("updated_at")
    private String updatedAt;

    // Associated User Details for easy presentation
    @JsonProperty("requester_name")
    private String requesterName;

    @JsonProperty("requester_email")
    private String requesterEmail;

    @JsonProperty("recipient_name")
    private String recipientName;

    @JsonProperty("recipient_email")
    private String recipientEmail;

    @JsonProperty("companion_id")
    private Long companionId;

    @JsonProperty("companion_name")
    private String companionName;

    @JsonProperty("companion_email")
    private String companionEmail;

    @JsonProperty("companion_phone")
    private String companionPhone;

    @JsonProperty("companion_district")
    private String companionDistrict;

    @JsonProperty("companion_state")
    private String companionState;

    public CompanionRelationship() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRequesterId() { return requesterId; }
    public void setRequesterId(Long requesterId) { this.requesterId = requesterId; }

    public Long getRecipientId() { return recipientId; }
    public void setRecipientId(Long recipientId) { this.recipientId = recipientId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }

    public String getRequesterEmail() { return requesterEmail; }
    public void setRequesterEmail(String requesterEmail) { this.requesterEmail = requesterEmail; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }

    public Long getCompanionId() { return companionId; }
    public void setCompanionId(Long companionId) { this.companionId = companionId; }

    public String getCompanionName() { return companionName; }
    public void setCompanionName(String companionName) { this.companionName = companionName; }

    public String getCompanionEmail() { return companionEmail; }
    public void setCompanionEmail(String companionEmail) { this.companionEmail = companionEmail; }

    public String getCompanionPhone() { return companionPhone; }
    public void setCompanionPhone(String companionPhone) { this.companionPhone = companionPhone; }

    public String getCompanionDistrict() { return companionDistrict; }
    public void setCompanionDistrict(String companionDistrict) { this.companionDistrict = companionDistrict; }

    public String getCompanionState() { return companionState; }
    public void setCompanionState(String companionState) { this.companionState = companionState; }
}
