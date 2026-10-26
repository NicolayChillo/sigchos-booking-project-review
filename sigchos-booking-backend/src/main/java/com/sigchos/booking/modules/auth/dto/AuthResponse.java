package com.sigchos.booking.modules.auth.dto;

import com.sigchos.booking.modules.user.dto.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private UserResponse user;
}
