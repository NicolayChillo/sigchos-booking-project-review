package com.sigchos.booking.modules.user.controller;

import com.sigchos.booking.modules.user.dto.ChangePasswordRequest;
import com.sigchos.booking.modules.user.dto.OnboardingCompleteRequest;
import com.sigchos.booking.modules.user.dto.ProfileUpdateRequest;
import com.sigchos.booking.modules.user.dto.UserResponse;
import com.sigchos.booking.modules.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/profile")
public class ProfileController {

    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserResponse getProfile(Authentication authentication) {
        return userService.getProfile(authentication.getName());
    }

    @PutMapping
    public UserResponse updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest request) {
        return userService.updateOwnProfile(authentication.getName(), request);
    }

    @PutMapping("/password")
    public void changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changeOwnPassword(authentication.getName(), request);
    }

    @PutMapping("/onboarding")
    public UserResponse completeOnboarding(
            Authentication authentication,
            @Valid @RequestBody OnboardingCompleteRequest request) {
        return userService.completeOnboarding(authentication.getName(), request);
    }
}
