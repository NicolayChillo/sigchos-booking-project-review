package com.sigchos.booking.modules.auth.config;

import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.modules.user.repository.UserRepository;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class SystemAdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.system-admin.email:}")
    private String email;

    @Value("${app.bootstrap.system-admin.password:}")
    private String password;

    @Value("${app.bootstrap.system-admin.first-name:System}")
    private String firstName;

    @Value("${app.bootstrap.system-admin.last-name:Admin}")
    private String lastName;

    @Value("${app.bootstrap.system-admin.phone:0000000000}")
    private String phone;

    @Value("${app.bootstrap.system-admin.birth-date:1990-01-01}")
    private String birthDate;

    public SystemAdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return;
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            return;
        }

        User admin = new User();
        admin.setFirstName(firstName.trim());
        admin.setLastName(lastName.trim());
        admin.setEmail(normalizedEmail);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setPhone(phone.trim());
        admin.setRuc(null);
        admin.setBirthDate(LocalDate.parse(birthDate));
        admin.setRole(Role.SYSTEM_ADMIN);
        admin.setActive(true);
        admin.setProfileCompleted(true);
        admin.setMustChangePassword(false);
        userRepository.save(admin);
    }
}
