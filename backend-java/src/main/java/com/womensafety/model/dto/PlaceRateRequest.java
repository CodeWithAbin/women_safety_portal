package com.womensafety.model.dto;

public class PlaceRateRequest {
    private Integer rating;

    public PlaceRateRequest() {}

    public PlaceRateRequest(Integer rating) {
        this.rating = rating;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }
}
