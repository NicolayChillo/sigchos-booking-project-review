package com.sigchos.booking.modules.user.dto;

import com.sigchos.booking.modules.role.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateUserRequest {

    private String firstName;

    private String lastName;

    @Email
    private String email;

    @Size(min = 8, max = 100)
    private String password;

    private String phone;

    private String ruc;

    @Past
    private LocalDate birthDate;

    private Role role;

    private Boolean active;
}
