package com.womensafety.service;

import com.womensafety.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String DEMO_DOMAIN = "@demo.womensafety.internal";

    private final Optional<JavaMailSender> mailSender;
    private final NotificationRepository notificationRepository;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.mail.from:noreply@womensafetyportal.com}")
    private String mailFrom;

    public EmailService(
            @Autowired(required = false) JavaMailSender mailSender,
            NotificationRepository notificationRepository) {
        this.mailSender = Optional.ofNullable(mailSender);
        this.notificationRepository = notificationRepository;
    }

    /**
     * Sends the password-reset OTP code through configured email or demo notification.
     * Note: Plaintext OTP is NEVER printed or logged.
     */
    public void sendPasswordResetOtp(String recipientEmail, String otpCode, Long userId) {
        if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
            return;
        }

        String normalizedEmail = recipientEmail.trim().toLowerCase();

        // 1. Synthetic Demo Users Isolation: deliver via in-app notification
        if (normalizedEmail.endsWith(DEMO_DOMAIN)) {
            if (userId != null) {
                try {
                    notificationRepository.insert(
                            userId,
                            null,
                            "Password Reset Verification Code",
                            "Your verification code is: " + otpCode + ". This code is valid for 15 minutes.",
                            "system"
                    );
                    log.info("Delivered password-reset verification code via in-app notification for demo account.");
                } catch (Exception e) {
                    log.warn("Failed to create in-app notification for demo account: {}", e.getMessage());
                }
            }
            return;
        }

        // 2. Real Users: Deliver via SMTP if configured
        if (mailSender.isPresent() && mailHost != null && !mailHost.trim().isEmpty()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailFrom);
                message.setTo(normalizedEmail);
                message.setSubject("Women Safety Portal - Password Reset Verification Code");
                message.setText(
                        "Hello,\n\n" +
                        "You requested a password reset for your Women Safety Portal account.\n\n" +
                        "Your 6-digit verification code is: " + otpCode + "\n\n" +
                        "This code is single-use and will expire in 15 minutes.\n" +
                        "If you did not request a password reset, you can safely ignore this email.\n\n" +
                        "Stay Safe,\n" +
                        "Women Safety Portal Team"
                );

                mailSender.get().send(message);
                log.info("Password reset verification email dispatched successfully.");
            } catch (Exception e) {
                log.warn("Could not dispatch password reset email via SMTP: {}", e.getMessage());
            }
        } else {
            // SMTP is not configured: do NOT log or expose OTP
            log.info("SMTP service not configured. Continuing without external email delivery.");
        }
    }
}
