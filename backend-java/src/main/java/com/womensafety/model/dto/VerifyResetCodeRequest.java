package com.womensafety.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerifyResetCodeRequest {

    @NotBlank(message = "Email address is required.")
    private String email;

    @NotBlank(message = "Verification code is required.")
    @Pattern(regexp = "^\\d{6}$", message = "Verification code must be a 6-digit number.")
    private String code;

    public VerifyResetCodeRequest() {}

    public VerifyResetCodeRequest(String email, String code) {
        this.email = email;
        this.code = code;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
