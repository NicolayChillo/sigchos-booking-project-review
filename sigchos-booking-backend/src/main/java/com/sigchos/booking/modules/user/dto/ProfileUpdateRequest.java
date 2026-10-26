package com.sigchos.booking.modules.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileUpdateRequest {

    private String firstName;

    private String lastName;

    @Email
    private String email;

    private String phone;

    @Past
    private LocalDate birthDate;
}
