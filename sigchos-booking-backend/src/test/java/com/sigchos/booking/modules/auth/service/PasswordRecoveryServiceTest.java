package com.sigchos.booking.modules.auth.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.auth.model.PasswordResetToken;
import com.sigchos.booking.modules.auth.repository.PasswordResetTokenRepository;
import com.sigchos.booking.modules.notifications.service.EmailNotificationService;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.modules.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordRecoveryService — Pruebas unitarias")
class PasswordRecoveryServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    private EmailNotificationService emailNotificationService;

    // Usamos el encoder real para probar hashing sin necesidad de mockear
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @InjectMocks
    private PasswordRecoveryService passwordRecoveryService;

    // ─── Helper para inyectar @Value fields ─────────────────────────────────

    private void injectValues() {
        ReflectionTestUtils.setField(passwordRecoveryService, "frontendBaseUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(passwordRecoveryService, "expirationMinutes", 30L);
        // Reemplazar el passwordEncoder inyectado por Mockito con el real
        ReflectionTestUtils.setField(passwordRecoveryService, "passwordEncoder", passwordEncoder);
    }

    // ─── Helper de fixture ────────────────────────────────────────────────────

    private User activeUser() {
        User u = new User();
        u.setId(1L);
        u.setEmail("user@test.com");
        u.setFirstName("Test");
        u.setLastName("User");
        u.setPhone("0999999999");
        u.setRole(Role.CLIENT);
        u.setActive(true);
        u.setPassword(passwordEncoder.encode("OldPassword1!"));
        return u;
    }

    private User inactiveUser() {
        User u = activeUser();
        u.setActive(false);
        return u;
    }

    private PasswordResetToken validToken(User user, String rawToken) {
        // Hashear el token de la misma manera que lo hace el servicio (SHA-256 hex)
        String tokenHash = hashTokenForTest(rawToken);
        return PasswordResetToken.builder()
                .id(1L)
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .usedAt(null)
                .build();
    }

    /** Replica el hashing SHA-256 que usa el servicio. */
    private String hashTokenForTest(String token) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hashed);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // ─── requestPasswordReset ─────────────────────────────────────────────────

    @Nested
    @DisplayName("requestPasswordReset()")
    class RequestPasswordReset {

        @Test
        @DisplayName("Email nulo → no hace nada (silencio)")
        void shouldDoNothingForNullEmail() {
            injectValues();
            assertThatCode(() -> passwordRecoveryService.requestPasswordReset(null))
                    .doesNotThrowAnyException();
            verify(userRepository, never()).findByEmail(anyString());
        }

        @Test
        @DisplayName("Email en blanco → no hace nada (silencio)")
        void shouldDoNothingForBlankEmail() {
            injectValues();
            assertThatCode(() -> passwordRecoveryService.requestPasswordReset("   "))
                    .doesNotThrowAnyException();
            verify(userRepository, never()).findByEmail(anyString());
        }

        @Test
        @DisplayName("Email de usuario no registrado → no hace nada (silencio)")
        void shouldDoNothingWhenUserNotFound() {
            injectValues();
            when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

            assertThatCode(() -> passwordRecoveryService.requestPasswordReset("unknown@test.com"))
                    .doesNotThrowAnyException();

            verify(emailNotificationService, never()).sendPasswordRecovery(any(), anyString(), anyLong());
        }

        @Test
        @DisplayName("Usuario inactivo → no hace nada (silencio)")
        void shouldDoNothingForInactiveUser() {
            injectValues();
            when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(inactiveUser()));

            assertThatCode(() -> passwordRecoveryService.requestPasswordReset("user@test.com"))
                    .doesNotThrowAnyException();

            verify(emailNotificationService, never()).sendPasswordRecovery(any(), anyString(), anyLong());
        }

        @Test
        @DisplayName("Flujo feliz: usuario activo → invalida tokens previos y envía email")
        void shouldInvalidatePreviousTokensAndSendEmail() {
            injectValues();
            User user = activeUser();
            when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
            when(passwordResetTokenRepository.findByUser_IdAndUsedAtIsNullAndExpiresAtAfter(anyLong(), any()))
                    .thenReturn(Collections.emptyList());
            when(passwordResetTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThatCode(() -> passwordRecoveryService.requestPasswordReset("user@test.com"))
                    .doesNotThrowAnyException();

            verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
            verify(emailNotificationService).sendPasswordRecovery(any(User.class), anyString(), anyLong());
        }

        @Test
        @DisplayName("Email se normaliza (trim + lowercase) antes de buscar")
        void shouldNormalizeEmailBeforeLookup() {
            injectValues();
            when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.empty());

            assertThatCode(() -> passwordRecoveryService.requestPasswordReset("  USER@TEST.COM  "))
                    .doesNotThrowAnyException();

            verify(userRepository).findByEmail("user@test.com");
        }
    }

    // ─── resetPassword ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("resetPassword()")
    class ResetPassword {

        @Test
        @DisplayName("Token no encontrado → 400")
        void shouldThrow400WhenTokenNotFound() {
            injectValues();
            String rawToken = "invalid-token-that-does-not-exist";
            when(passwordResetTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> passwordRecoveryService.resetPassword(rawToken, "NewPass1!"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Token de recuperacion invalido o expirado");
        }

        @Test
        @DisplayName("Token expirado → 400")
        void shouldThrow400WhenTokenIsExpired() {
            injectValues();
            User user = activeUser();
            String rawToken = "some-valid-looking-token";
            String tokenHash = hashTokenForTest(rawToken);

            PasswordResetToken expiredToken = PasswordResetToken.builder()
                    .id(1L)
                    .user(user)
                    .tokenHash(tokenHash)
                    .expiresAt(LocalDateTime.now().minusMinutes(5))  // ya expiró
                    .usedAt(null)
                    .build();

            when(passwordResetTokenRepository.findByTokenHash(tokenHash))
                    .thenReturn(Optional.of(expiredToken));

            assertThatThrownBy(() -> passwordRecoveryService.resetPassword(rawToken, "NewPass1!"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Token de recuperacion invalido o expirado");
        }

        @Test
        @DisplayName("Token ya usado → 400")
        void shouldThrow400WhenTokenAlreadyUsed() {
            injectValues();
            User user = activeUser();
            String rawToken = "already-used-token";
            String tokenHash = hashTokenForTest(rawToken);

            PasswordResetToken usedToken = PasswordResetToken.builder()
                    .id(1L)
                    .user(user)
                    .tokenHash(tokenHash)
                    .expiresAt(LocalDateTime.now().plusMinutes(20))
                    .usedAt(LocalDateTime.now().minusMinutes(5))  // ya fue usado
                    .build();

            when(passwordResetTokenRepository.findByTokenHash(tokenHash))
                    .thenReturn(Optional.of(usedToken));

            assertThatThrownBy(() -> passwordRecoveryService.resetPassword(rawToken, "NewPass1!"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Token de recuperacion invalido o expirado");
        }

        @Test
        @DisplayName("Usuario inactivo → 400")
        void shouldThrow400WhenUserIsInactive() {
            injectValues();
            User user = inactiveUser();
            String rawToken = "valid-token";
            String tokenHash = hashTokenForTest(rawToken);

            PasswordResetToken token = validToken(user, rawToken);
            // Sobreescribimos el tokenHash correcto ya que validToken usa el mismo helper
            token.setTokenHash(tokenHash);

            when(passwordResetTokenRepository.findByTokenHash(tokenHash))
                    .thenReturn(Optional.of(token));

            assertThatThrownBy(() -> passwordRecoveryService.resetPassword(rawToken, "NewPass1!"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Usuario inactivo");
        }

        @Test
        @DisplayName("Nueva contraseña igual a la anterior → 400")
        void shouldThrow400WhenNewPasswordIsSameAsOld() {
            injectValues();
            User user = activeUser();  // contraseña hasheada de "OldPassword1!"
            String rawToken = "valid-token-same-pass";
            String tokenHash = hashTokenForTest(rawToken);

            PasswordResetToken token = PasswordResetToken.builder()
                    .id(1L).user(user).tokenHash(tokenHash)
                    .expiresAt(LocalDateTime.now().plusMinutes(20)).usedAt(null)
                    .build();

            when(passwordResetTokenRepository.findByTokenHash(tokenHash))
                    .thenReturn(Optional.of(token));

            assertThatThrownBy(() -> passwordRecoveryService.resetPassword(rawToken, "OldPassword1!"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("La nueva contraseña debe ser diferente");
        }

        @Test
        @DisplayName("Flujo feliz: cambia el password y marca el token como usado")
        void shouldResetPasswordSuccessfully() {
            injectValues();
            User user = activeUser();
            String rawToken = "valid-token-happy-path";
            String tokenHash = hashTokenForTest(rawToken);

            PasswordResetToken token = PasswordResetToken.builder()
                    .id(1L).user(user).tokenHash(tokenHash)
                    .expiresAt(LocalDateTime.now().plusMinutes(20)).usedAt(null)
                    .build();

            when(passwordResetTokenRepository.findByTokenHash(tokenHash))
                    .thenReturn(Optional.of(token));
            when(passwordResetTokenRepository.findByUser_IdAndUsedAtIsNullAndExpiresAtAfter(anyLong(), any()))
                    .thenReturn(Collections.emptyList());

            assertThatCode(() -> passwordRecoveryService.resetPassword(rawToken, "BrandNewPass1!"))
                    .doesNotThrowAnyException();

            // La contraseña del usuario fue actualizada (ya no matchea la original)
            assert !passwordEncoder.matches("OldPassword1!", user.getPassword());
            // El token fue marcado como usado
            assert token.getUsedAt() != null;
        }
    }
}
