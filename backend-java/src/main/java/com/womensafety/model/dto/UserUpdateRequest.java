package com.womensafety.model.dto;

public class UserUpdateRequest {
    private String name;
    private String email;
    private String state;
    private String district;
    private String phone;

    public UserUpdateRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
