package com.womensafety.controller;

import com.womensafety.model.dto.*;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // 1. User registration (Public)
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Object>> register(@Valid @RequestBody RegisterRequest req) {
        ApiResponse<Object> response = authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 2. Unified login for User & Admin (Public)
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Object>> login(@Valid @RequestBody LoginRequest req) {
        ApiResponse<Object> response = authService.login(req);
        return ResponseEntity.ok(response);
    }

    // 3. Current session hydration & verification (Authenticated)
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Object>> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        ApiResponse<Object> response = authService.getMe(principal);
        return ResponseEntity.ok(response);
    }

    // 4. Request password-reset OTP (Public)
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        ApiResponse<Void> response = authService.forgotPassword(req);
        return ResponseEntity.ok(response);
    }

    // 5. Verify 6-digit reset code (Public)
    @PostMapping("/verify-reset-code")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest req) {
        ApiResponse<Map<String, Object>> response = authService.verifyResetCode(req);
        return ResponseEntity.ok(response);
    }

    // 6. Reset password using verified authorization (Public)
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        ApiResponse<Void> response = authService.resetPassword(req);
        return ResponseEntity.ok(response);
    }
}
