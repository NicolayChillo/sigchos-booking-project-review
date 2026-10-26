package com.sigchos.booking.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GoogleLoginRequest {

    @NotBlank(message = "El ID Token de Google es obligatorio")
    private String idToken;
}
