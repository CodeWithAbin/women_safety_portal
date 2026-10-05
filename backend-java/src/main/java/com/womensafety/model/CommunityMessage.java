package com.womensafety.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class CommunityMessage {
    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("user_name")
    private String userName;

    @JsonProperty("user_role")
    private String userRole;

    @JsonProperty("user_state")
    private String userState;

    @JsonProperty("user_district")
    private String userDistrict;

    private String message;

    @JsonProperty("reply_to_message_id")
    private Long replyToMessageId;

    @JsonProperty("reply_to_user_name")
    private String replyToUserName;

    @JsonProperty("reply_to_snippet")
    private String replyToSnippet;

    @JsonProperty("is_deleted")
    private Integer isDeleted;

    @JsonProperty("created_at")
    private String createdAt;

    @JsonProperty("updated_at")
    private String updatedAt;

    public CommunityMessage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public String getUserState() { return userState; }
    public void setUserState(String userState) { this.userState = userState; }

    public String getUserDistrict() { return userDistrict; }
    public void setUserDistrict(String userDistrict) { this.userDistrict = userDistrict; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getReplyToMessageId() { return replyToMessageId; }
    public void setReplyToMessageId(Long replyToMessageId) { this.replyToMessageId = replyToMessageId; }

    public String getReplyToUserName() { return replyToUserName; }
    public void setReplyToUserName(String replyToUserName) { this.replyToUserName = replyToUserName; }

    public String getReplyToSnippet() { return replyToSnippet; }
    public void setReplyToSnippet(String replyToSnippet) { this.replyToSnippet = replyToSnippet; }

    public Integer getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Integer isDeleted) { this.isDeleted = isDeleted; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
