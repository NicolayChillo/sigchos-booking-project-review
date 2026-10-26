package com.sigchos.booking.modules.auth.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.auth.model.PasswordResetToken;
import com.sigchos.booking.modules.auth.repository.PasswordResetTokenRepository;
import com.sigchos.booking.modules.notifications.service.EmailNotificationService;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.modules.user.repository.UserRepository;

@Service
public class PasswordRecoveryService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailNotificationService emailNotificationService;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Value("${app.security.password-reset.expiration-minutes:30}")
    private long expirationMinutes;

    public PasswordRecoveryService(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            EmailNotificationService emailNotificationService) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional
    public void requestPasswordReset(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        if (email == null || email.isBlank()) {
            return;
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !user.isActive()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        invalidateActiveTokens(user.getId(), now);

        String token = generateToken();
        String tokenHash = hashToken(token);
        LocalDateTime expiresAt = now.plusMinutes(expirationMinutes);

        PasswordResetToken passwordResetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .build();

        passwordResetTokenRepository.save(passwordResetToken);

        String resetUrl = buildResetUrl(token);
        emailNotificationService.sendPasswordRecovery(user, resetUrl, expirationMinutes);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        LocalDateTime now = LocalDateTime.now();

        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByTokenHash(hashToken(token))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Token de recuperacion invalido o expirado"));

        if (passwordResetToken.getUsedAt() != null || !passwordResetToken.getExpiresAt().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token de recuperacion invalido o expirado");
        }

        User user = passwordResetToken.getUser();
        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario inactivo");
        }

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La nueva contraseña debe ser diferente a la anterior");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        passwordResetToken.setUsedAt(now);

        invalidateActiveTokens(user.getId(), now);
    }

    private void invalidateActiveTokens(Long userId, LocalDateTime now) {
        passwordResetTokenRepository.findByUser_IdAndUsedAtIsNullAndExpiresAtAfter(userId, now)
                .forEach(token -> token.setUsedAt(now));
    }

    private String buildResetUrl(String token) {
        String normalizedBaseUrl = frontendBaseUrl;

        if (normalizedBaseUrl.endsWith("/")) {
            normalizedBaseUrl = normalizedBaseUrl.substring(0, normalizedBaseUrl.length() - 1);
        }

        return normalizedBaseUrl + "/auth/reset-password?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateToken() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashedBytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashedBytes);
        } catch (Exception exception) {
            throw new IllegalStateException("No fue posible procesar el token de recuperacion", exception);
        }
    }
}
