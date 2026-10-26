package com.sigchos.booking.modules.auth.controller;

import com.sigchos.booking.modules.auth.dto.AuthResponse;
import com.sigchos.booking.modules.auth.dto.ForgotPasswordRequest;
import com.sigchos.booking.modules.auth.dto.GoogleLoginRequest;
import com.sigchos.booking.modules.auth.dto.LoginRequest;
import com.sigchos.booking.modules.auth.dto.RegisterRequest;
import com.sigchos.booking.modules.auth.dto.ResetPasswordRequest;
import com.sigchos.booking.modules.auth.service.PasswordRecoveryService;
import com.sigchos.booking.modules.user.dto.UserResponse;
import com.sigchos.booking.modules.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final PasswordRecoveryService passwordRecoveryService;

    public AuthController(UserService userService, PasswordRecoveryService passwordRecoveryService) {
        this.userService = userService;
        this.passwordRecoveryService = passwordRecoveryService;
    }

    @PostMapping("/register")
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return userService.registerClient(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return userService.login(request);
    }

    @PostMapping("/google")
    public AuthResponse loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return userService.loginWithGoogle(request.getIdToken());
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordRecoveryService.requestPasswordReset(request.getEmail());
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordRecoveryService.resetPassword(request.getToken(), request.getNewPassword());
    }
}
