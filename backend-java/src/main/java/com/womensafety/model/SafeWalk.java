package com.womensafety.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class SafeWalk {
    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("companion_id")
    private Long companionId;

    @JsonProperty("start_latitude")
    private Double startLatitude;

    @JsonProperty("start_longitude")
    private Double startLongitude;

    private String destination;

    @JsonProperty("expected_arrival")
    private String expectedArrival;

    private String status; // ACTIVE, COMPLETED, CANCELLED, OVERDUE

    @JsonProperty("last_latitude")
    private Double lastLatitude;

    @JsonProperty("last_longitude")
    private Double lastLongitude;

    @JsonProperty("last_location_updated_at")
    private String lastLocationUpdatedAt;

    @JsonProperty("timing_status")
    private String timingStatus; // ACTIVE, GRACE, OVERDUE, COMPLETED, CANCELLED

    @JsonProperty("grace_period_minutes")
    private Integer gracePeriodMinutes;

    @JsonProperty("grace_until")
    private String graceUntil;

    @JsonProperty("overdue_notified_at")
    private String overdueNotifiedAt;

    @JsonProperty("started_at")
    private String startedAt;

    @JsonProperty("completed_at")
    private String completedAt;

    @JsonProperty("cancelled_at")
    private String cancelledAt;

    @JsonProperty("created_at")
    private String createdAt;

    @JsonProperty("updated_at")
    private String updatedAt;

    // Joined Walker and Companion info
    @JsonProperty("user_name")
    private String userName;

    @JsonProperty("user_email")
    private String userEmail;

    @JsonProperty("user_phone")
    private String userPhone;

    @JsonProperty("companion_name")
    private String companionName;

    @JsonProperty("companion_email")
    private String companionEmail;

    @JsonProperty("companion_phone")
    private String companionPhone;

    public SafeWalk() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getCompanionId() { return companionId; }
    public void setCompanionId(Long companionId) { this.companionId = companionId; }

    public Double getStartLatitude() { return startLatitude; }
    public void setStartLatitude(Double startLatitude) { this.startLatitude = startLatitude; }

    public Double getStartLongitude() { return startLongitude; }
    public void setStartLongitude(Double startLongitude) { this.startLongitude = startLongitude; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public String getExpectedArrival() { return expectedArrival; }
    public void setExpectedArrival(String expectedArrival) { this.expectedArrival = expectedArrival; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getLastLatitude() { return lastLatitude; }
    public void setLastLatitude(Double lastLatitude) { this.lastLatitude = lastLatitude; }

    public Double getLastLongitude() { return lastLongitude; }
    public void setLastLongitude(Double lastLongitude) { this.lastLongitude = lastLongitude; }

    public String getLastLocationUpdatedAt() { return lastLocationUpdatedAt; }
    public void setLastLocationUpdatedAt(String lastLocationUpdatedAt) { this.lastLocationUpdatedAt = lastLocationUpdatedAt; }

    public String getTimingStatus() { return timingStatus; }
    public void setTimingStatus(String timingStatus) { this.timingStatus = timingStatus; }

    public Integer getGracePeriodMinutes() { return gracePeriodMinutes; }
    public void setGracePeriodMinutes(Integer gracePeriodMinutes) { this.gracePeriodMinutes = gracePeriodMinutes; }

    public String getGraceUntil() { return graceUntil; }
    public void setGraceUntil(String graceUntil) { this.graceUntil = graceUntil; }

    public String getOverdueNotifiedAt() { return overdueNotifiedAt; }
    public void setOverdueNotifiedAt(String overdueNotifiedAt) { this.overdueNotifiedAt = overdueNotifiedAt; }

    public String getStartedAt() { return startedAt; }
    public void setStartedAt(String startedAt) { this.startedAt = startedAt; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }

    public String getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(String cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserPhone() { return userPhone; }
    public void setUserPhone(String userPhone) { this.userPhone = userPhone; }

    public String getCompanionName() { return companionName; }
    public void setCompanionName(String companionName) { this.companionName = companionName; }

    public String getCompanionEmail() { return companionEmail; }
    public void setCompanionEmail(String companionEmail) { this.companionEmail = companionEmail; }

    public String getCompanionPhone() { return companionPhone; }
    public void setCompanionPhone(String companionPhone) { this.companionPhone = companionPhone; }
}
