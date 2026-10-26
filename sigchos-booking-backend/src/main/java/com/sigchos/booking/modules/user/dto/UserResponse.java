package com.sigchos.booking.modules.user.dto;

import com.sigchos.booking.modules.role.model.Role;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String ruc;
    private LocalDate birthDate;
    private Role role;
    private boolean active;
    private boolean profileCompleted;
    private boolean mustChangePassword;
    private boolean hasPassword;
}
