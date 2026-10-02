package com.womensafety.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Place {
    private Long id;
    private String name;
    private String address;
    private String state;
    private String district;
    private Double latitude;
    private Double longitude;
    private String photo;
    private Integer rating;
    private String description;
    private String status;

    @JsonProperty("distance_km")
    private Double distanceKm;

    @JsonProperty("resolved")
    private Boolean resolved;

    @JsonProperty("resolved_at")
    private String resolvedAt;

    @JsonProperty("submitted_by")
    private Long submittedBy;

    @JsonProperty("created_at")
    private String createdAt;

    @JsonProperty("updated_at")
    private String updatedAt;

    @JsonProperty("community_rating")
    private Double communityRating;

    @JsonProperty("rating_count")
    private Integer ratingCount;

    @JsonProperty("user_rating")
    private Integer userRating;

    @JsonProperty("has_rated")
    private Boolean hasRated;

    // Joined fields for admin views
    @JsonProperty("reporter_name")
    private String reporterName;

    @JsonProperty("reporter_email")
    private String reporterEmail;

    @JsonProperty("reporter_phone")
    private String reporterPhone;

    public Place() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getResolved() { return resolved != null ? resolved : false; }
    public void setResolved(Boolean resolved) { this.resolved = resolved; }

    public String getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(String resolvedAt) { this.resolvedAt = resolvedAt; }

    public Long getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(Long submittedBy) { this.submittedBy = submittedBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getReporterName() { return reporterName; }
    public void setReporterName(String reporterName) { this.reporterName = reporterName; }

    public String getReporterEmail() { return reporterEmail; }
    public void setReporterEmail(String reporterEmail) { this.reporterEmail = reporterEmail; }

    public String getReporterPhone() { return reporterPhone; }
    public void setReporterPhone(String reporterPhone) { this.reporterPhone = reporterPhone; }

    public Double getCommunityRating() { return communityRating; }
    public void setCommunityRating(Double communityRating) { this.communityRating = communityRating; }

    public Integer getRatingCount() { return ratingCount != null ? ratingCount : 0; }
    public void setRatingCount(Integer ratingCount) { this.ratingCount = ratingCount; }

    public Integer getUserRating() { return userRating; }
    public void setUserRating(Integer userRating) { this.userRating = userRating; }

    public Boolean getHasRated() { return hasRated != null ? hasRated : false; }
    public void setHasRated(Boolean hasRated) { this.hasRated = hasRated; }
}
