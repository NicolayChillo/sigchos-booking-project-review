package com.sigchos.booking.modules.user.mapper;

import com.sigchos.booking.modules.user.dto.UserResponse;
import com.sigchos.booking.modules.user.dto.UserSummary;
import com.sigchos.booking.modules.user.model.User;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getRuc(),
                user.getBirthDate(),
                user.getRole(),
                user.isActive(),
                user.isProfileCompleted(),
                user.isMustChangePassword(),
                user.isHasPassword());
    }

    public static UserSummary toSummary(User user) {
        return new UserSummary(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole());
    }
}
