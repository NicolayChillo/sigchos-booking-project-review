package com.sigchos.booking.modules.user.dto;

import com.sigchos.booking.modules.role.model.Role;

public record UserSummary(
        Long id,
        String firstName,
        String lastName,
        String email,
        Role role) {
}
