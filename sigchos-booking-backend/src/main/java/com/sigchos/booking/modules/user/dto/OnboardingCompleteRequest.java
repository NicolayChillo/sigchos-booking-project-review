package com.sigchos.booking.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record OnboardingCompleteRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String phone,
        @Past LocalDate birthDate,
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 8, max = 100) String newPassword) {
}