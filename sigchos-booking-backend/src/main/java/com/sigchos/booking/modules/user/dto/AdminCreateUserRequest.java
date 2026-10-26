package com.sigchos.booking.modules.user.dto;

import com.sigchos.booking.modules.role.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCreateUserRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 8, max = 100)
    private String password;

    @NotBlank
    private String phone;

    private String ruc;

    @NotNull
    @Past
    private LocalDate birthDate;

    @NotNull
    private Role role;

    private Boolean active;
}
