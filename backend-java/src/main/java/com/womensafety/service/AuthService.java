package com.womensafety.service;

import com.womensafety.exception.BadRequestException;
import com.womensafety.exception.UnauthorizedException;
import com.womensafety.model.User;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.LoginRequest;
import com.womensafety.model.dto.RegisterRequest;
import com.womensafety.repository.UserRepository;
import com.womensafety.security.JwtTokenProvider;
import com.womensafety.security.UserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\s@]+@[^\s@]+\\.[^\s@]+$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
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
}
