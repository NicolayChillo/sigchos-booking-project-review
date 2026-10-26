package com.sigchos.booking.modules.user.controller;

import com.sigchos.booking.modules.user.dto.AdminCreateUserRequest;
import com.sigchos.booking.modules.user.dto.AdminUpdateUserRequest;
import com.sigchos.booking.modules.user.dto.UserResponse;
import com.sigchos.booking.modules.user.service.UserService;
import jakarta.validation.Valid;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public UserResponse create(@Valid @RequestBody AdminCreateUserRequest request) {
        return userService.createUserAsAdmin(request);
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody AdminUpdateUserRequest request) {
        return userService.updateUserAsAdmin(id, request);
    }

    @GetMapping
    public List<UserResponse> getAll() {
        return userService.getAllUsers();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        userService.deleteUserAsAdmin(id);
    }

    @PatchMapping("/{id}/restore")
    public void restore(@PathVariable Long id) {
        userService.restoreUserAsAdmin(id);
    }
}
