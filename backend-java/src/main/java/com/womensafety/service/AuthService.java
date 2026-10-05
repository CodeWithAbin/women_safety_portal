package com.womensafety.service;

import com.womensafety.exception.BadRequestException;
import com.womensafety.exception.UnauthorizedException;
import com.womensafety.model.PasswordReset;
import com.womensafety.model.User;
import com.womensafety.model.dto.*;
import com.womensafety.repository.PasswordResetRepository;
import com.womensafety.repository.UserRepository;
import com.womensafety.security.JwtTokenProvider;
import com.womensafety.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\s@]+@[^\s@]+\\.[^\s@]+$");
    private static final DateTimeFormatter SQLITE_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final int OTP_EXPIRY_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.admin.email:admin@gmail.com}")
    private String adminEmail;

    public AuthService(
            UserRepository userRepository,
            PasswordResetRepository passwordResetRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordResetRepository = passwordResetRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public ApiResponse<Object> register(RegisterRequest req) {
        if (req.getName() == null || req.getName().trim().isEmpty() ||
            req.getEmail() == null || req.getEmail().trim().isEmpty() ||
            req.getPassword() == null || req.getPassword().trim().isEmpty() ||
            req.getState() == null || req.getState().trim().isEmpty() ||
            req.getDistrict() == null || req.getDistrict().trim().isEmpty()) {
            throw new BadRequestException("Missing required fields: name, email, password, state, district");
        }

        String email = req.getEmail().trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new BadRequestException("Please provide a valid email address.");
        }

        if (req.getPassword().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("An account with this email already exists.");
        }

        String passwordHash = passwordEncoder.encode(req.getPassword());
        Long userId = userRepository.insert(
                req.getName().trim(),
                email,
                passwordHash,
                req.getState().trim(),
                req.getDistrict().trim(),
                req.getPhone() != null ? req.getPhone().trim() : null,
                "user"
        );

        String token = tokenProvider.generateToken(userId, email, "user");

        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("id", userId);
        userMap.put("name", req.getName().trim());
        userMap.put("email", email);
        userMap.put("state", req.getState().trim());
        userMap.put("district", req.getDistrict().trim());
        userMap.put("phone", req.getPhone() != null ? req.getPhone().trim() : null);
        userMap.put("role", "user");

        ApiResponse<Object> response = ApiResponse.success("User registered successfully.");
        response.setToken(token);
        response.setUser(userMap);
        return response;
    }

    public ApiResponse<Object> login(LoginRequest req) {
        if (req.getEmail() == null || req.getEmail().trim().isEmpty() ||
            req.getPassword() == null || req.getPassword().trim().isEmpty()) {
            throw new BadRequestException("Email and password are required.");
        }

        String email = req.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());

        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("id", user.getId());
        userMap.put("name", user.getName());
        userMap.put("email", user.getEmail());
        userMap.put("role", user.getRole());
        userMap.put("state", user.getState());
        userMap.put("district", user.getDistrict());
        userMap.put("phone", user.getPhone());

        ApiResponse<Object> response = ApiResponse.success("Login successful.");
        response.setToken(token);
        response.setUser(userMap);
        return response;
    }

    public ApiResponse<Object> getMe(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UnauthorizedException("Invalid session. User account not found."));

        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("id", user.getId());
        userMap.put("name", user.getName());
        userMap.put("email", user.getEmail());
        userMap.put("state", user.getState());
        userMap.put("district", user.getDistrict());
        userMap.put("phone", user.getPhone());
        userMap.put("role", user.getRole());

        ApiResponse<Object> response = ApiResponse.success("Session restored");
        response.setUser(userMap);
        return response;
    }

    // =========================================================================
    // 1. Forgot Password Request (No account enumeration)
    // =========================================================================
    public ApiResponse<Void> forgotPassword(ForgotPasswordRequest req) {
        if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email address is required.");
        }

        String email = req.getEmail().trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new BadRequestException("Please provide a valid email address.");
        }

        // Generic response string for anti-enumeration
        final String genericSuccessMessage = "If an account exists with this email address, password reset instructions have been sent.";

        // Prevent public password-reset on the root administrator account
        if (adminEmail != null && email.equalsIgnoreCase(adminEmail.trim())) {
            log.info("Password reset requested for primary admin email - suppressed from public flow.");
            return ApiResponse.success(genericSuccessMessage);
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent email - returning generic success.");
            return ApiResponse.success(genericSuccessMessage);
        }

        User user = userOpt.get();
        if ("admin".equalsIgnoreCase(user.getRole())) {
            log.info("Password reset requested for admin user - suppressed from public flow.");
            return ApiResponse.success(genericSuccessMessage);
        }

        // Invalidate any existing active reset records for this email
        passwordResetRepository.invalidateActiveRequests(email);

        // Generate 6-digit cryptographic OTP (100000 - 999999)
        int randomCode = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(randomCode);

        // Compute SHA-256 of OTP (never store plaintext OTP)
        String tokenHash = hashSha256(otpCode);
        String expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES).format(SQLITE_DATE_FORMAT);

        // Store hashed OTP in password_resets table
        passwordResetRepository.create(email, tokenHash, expiresAt);

        // Dispatch via email service or isolated demo notification
        emailService.sendPasswordResetOtp(email, otpCode, user.getId());

        return ApiResponse.success(genericSuccessMessage);
    }

    // =========================================================================
    // 2. Verify Reset Code (OTP verification step)
    // =========================================================================
    public ApiResponse<Map<String, Object>> verifyResetCode(VerifyResetCodeRequest req) {
        if (req.getEmail() == null || req.getEmail().trim().isEmpty() ||
            req.getCode() == null || req.getCode().trim().isEmpty()) {
            throw new BadRequestException("Email and verification code are required.");
        }

        String email = req.getEmail().trim().toLowerCase();
        String code = req.getCode().trim();

        PasswordReset activeReset = passwordResetRepository.findActiveByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification code. Please request a new code."));

        // Check attempts limit (max 5)
        if (activeReset.getAttempts() >= MAX_OTP_ATTEMPTS) {
            passwordResetRepository.markUsed(activeReset.getId());
            throw new BadRequestException("Too many invalid verification attempts. This code has been deactivated. Please request a new code.");
        }

        String incomingHash = hashSha256(code);
        if (!incomingHash.equals(activeReset.getTokenHash())) {
            passwordResetRepository.incrementAttempts(activeReset.getId());
            int remainingAttempts = MAX_OTP_ATTEMPTS - (activeReset.getAttempts() + 1);
            if (remainingAttempts <= 0) {
                passwordResetRepository.markUsed(activeReset.getId());
                throw new BadRequestException("Too many invalid verification attempts. This code has been deactivated. Please request a new code.");
            }
            throw new BadRequestException("Invalid verification code. " + remainingAttempts + " attempt(s) remaining.");
        }

        // Generate high-entropy single-use reset authorization token (32 bytes = 64 hex chars)
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String resetToken = HexFormat.of().formatHex(tokenBytes);

        // Store SHA-256 hash of the reset token and mark verified
        String resetTokenHash = hashSha256(resetToken);
        passwordResetRepository.markVerified(activeReset.getId(), resetTokenHash);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("email", email);
        data.put("reset_token", resetToken);

        return ApiResponse.success("Verification code verified successfully.", data);
    }

    // =========================================================================
    // 3. Reset Password (Enforces verified reset token)
    // =========================================================================
    public ApiResponse<Void> resetPassword(ResetPasswordRequest req) {
        if (req.getEmail() == null || req.getEmail().trim().isEmpty() ||
            req.getResetToken() == null || req.getResetToken().trim().isEmpty() ||
            req.getNewPassword() == null || req.getNewPassword().trim().isEmpty()) {
            throw new BadRequestException("Email, reset token, and new password are required.");
        }

        String email = req.getEmail().trim().toLowerCase();
        String resetToken = req.getResetToken().trim();
        String newPassword = req.getNewPassword();

        if (newPassword.length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long.");
        }

        String resetTokenHash = hashSha256(resetToken);
        PasswordReset verifiedReset = passwordResetRepository.findVerifiedByEmailAndResetTokenHash(email, resetTokenHash)
                .orElseThrow(() -> new BadRequestException("Password reset authorization is invalid, expired, or has already been used. Please restart the reset process."));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User account not found."));

        if ("admin".equalsIgnoreCase(user.getRole()) || (adminEmail != null && email.equalsIgnoreCase(adminEmail.trim()))) {
            throw new BadRequestException("Password reset is not permitted for administrator accounts.");
        }

        // Update password using BCrypt
        String newPasswordHash = passwordEncoder.encode(newPassword);
        userRepository.updatePassword(user.getId(), newPasswordHash);

        // Invalidate the reset token and any remaining requests for this email
        passwordResetRepository.markUsed(verifiedReset.getId());
        passwordResetRepository.markAllUsedForEmail(email);

        log.info("Password successfully reset for user account.");
        return ApiResponse.success("Password has been reset successfully. You can now sign in with your new password.");
    }

    // =========================================================================
    // Helper: Cryptographic SHA-256 Hashing
    // =========================================================================
    private String hashSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm is not available in JVM", e);
        }
    }
}
