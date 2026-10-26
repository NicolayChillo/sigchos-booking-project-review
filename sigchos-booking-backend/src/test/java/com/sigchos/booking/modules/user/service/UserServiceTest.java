package com.sigchos.booking.modules.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.auth.dto.AuthResponse;
import com.sigchos.booking.modules.auth.dto.LoginRequest;
import com.sigchos.booking.modules.auth.dto.RegisterRequest;
import com.sigchos.booking.modules.auth.security.JwtService;
import com.sigchos.booking.modules.establishments.service.EstablishmentService;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.user.dto.UserResponse;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.modules.user.dto.AdminCreateUserRequest;
import com.sigchos.booking.modules.user.dto.ChangePasswordRequest;
import com.sigchos.booking.modules.user.dto.ProfileUpdateRequest;
import com.sigchos.booking.modules.user.repository.UserRepository;
import java.util.List;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private EstablishmentService establishmentService;

    private final String googleClientId = "test-client-id";

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(
                userRepository,
                passwordEncoder,
                authenticationManager,
                jwtService,
                googleClientId,
                establishmentService);
    }

    @Test
    void registerClient_ShouldCreateNewUser_WhenEmailIsNotTaken() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Juan");
        request.setLastName("Perez");
        request.setEmail("juan@test.com");
        request.setPassword("password123");
        request.setPhone("0999999999");
        request.setBirthDate(LocalDate.of(1990, 1, 1));

        when(userRepository.existsByEmail("juan@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded_pwd");

        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setFirstName("Juan");
        savedUser.setLastName("Perez");
        savedUser.setEmail("juan@test.com");
        savedUser.setRole(Role.CLIENT);
        savedUser.setActive(true);

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserResponse response = userService.registerClient(request);

        assertNotNull(response);
        assertEquals("Juan", response.getFirstName());
        assertEquals(Role.CLIENT, response.getRole());
        assertTrue(response.isActive());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerClient_ShouldThrowConflict_WhenEmailIsTaken() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Juan");
        request.setLastName("Perez");
        request.setEmail("juan@test.com");
        request.setPassword("password123");
        request.setPhone("0999999999");
        request.setBirthDate(LocalDate.of(1990, 1, 1));

        when(userRepository.existsByEmail("juan@test.com")).thenReturn(true);

        assertThrows(ResponseStatusException.class, () -> userService.registerClient(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_ShouldReturnAuthResponse_WhenCredentialsAreValid() {
        LoginRequest request = new LoginRequest();
        request.setEmail("juan@test.com");
        request.setPassword("password123");

        User user = new User();
        user.setId(1L);
        user.setEmail("juan@test.com");
        user.setRole(Role.CLIENT);
        user.setActive(true);

        when(userRepository.findByEmail("juan@test.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any(), any(User.class))).thenReturn("fake-jwt-token");

        AuthResponse response = userService.login(request);

        assertNotNull(response);
        assertEquals("fake-jwt-token", response.getToken());
        assertEquals("juan@test.com", response.getUser().getEmail());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_ShouldThrowForbidden_WhenUserIsInactive() {
        LoginRequest request = new LoginRequest();
        request.setEmail("juan@test.com");
        request.setPassword("password123");

        User user = new User();
        user.setId(1L);
        user.setEmail("juan@test.com");
        user.setActive(false);

        when(userRepository.findByEmail("juan@test.com")).thenReturn(Optional.of(user));

        assertThrows(ResponseStatusException.class, () -> userService.login(request));
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void getProfile_ShouldReturnUser_WhenEmailExists() {
        User user = new User();
        user.setId(1L);
        user.setFirstName("Maria");
        user.setEmail("maria@test.com");

        when(userRepository.findByEmail("maria@test.com")).thenReturn(Optional.of(user));

        UserResponse response = userService.getProfile("maria@test.com");
        assertNotNull(response);
        assertEquals("Maria", response.getFirstName());
    }

    @Test
    void updateOwnProfile_ShouldUpdateAndReturnUser() {
        ProfileUpdateRequest request = new ProfileUpdateRequest();
        request.setFirstName("NuevoNombre");
        
        User user = new User();
        user.setId(1L);
        user.setEmail("maria@test.com");
        user.setFirstName("Maria");
        
        when(userRepository.findByEmail("maria@test.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse response = userService.updateOwnProfile("maria@test.com", request);

        assertNotNull(response);
        assertEquals("NuevoNombre", response.getFirstName());
        verify(userRepository).save(user);
    }

    @Test
    void changeOwnPassword_ShouldUpdatePassword() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPass");
        request.setNewPassword("newPass");

        User user = new User();
        user.setId(1L);
        user.setEmail("maria@test.com");
        user.setPassword("encodedOldPass");

        when(userRepository.findByEmail("maria@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPass", "encodedOldPass")).thenReturn(true);
        when(passwordEncoder.encode("newPass")).thenReturn("encodedNewPass");

        assertDoesNotThrow(() -> userService.changeOwnPassword("maria@test.com", request));
        assertEquals("encodedNewPass", user.getPassword());
    }

    @Test
    void createUserAsAdmin_ShouldCreateAdminUser() {
        AdminCreateUserRequest request = new AdminCreateUserRequest();
        request.setEmail("admin2@test.com");
        request.setFirstName("Admin");
        request.setLastName("Dos");
        request.setPassword("pass");
        request.setPhone("099");
        request.setRole(Role.SYSTEM_ADMIN);
        request.setActive(true);

        when(userRepository.existsByEmail("admin2@test.com")).thenReturn(false);
        when(passwordEncoder.encode("pass")).thenReturn("encoded");
        
        User saved = new User();
        saved.setId(2L);
        saved.setRole(Role.SYSTEM_ADMIN);
        when(userRepository.save(any(User.class))).thenReturn(saved);

        UserResponse res = userService.createUserAsAdmin(request);
        assertNotNull(res);
        assertEquals(Role.SYSTEM_ADMIN, res.getRole());
    }

    @Test
    void deleteUserAsAdmin_ShouldDeactivateUser() {
        User user = new User();
        user.setId(1L);
        user.setActive(true);
        user.setRole(Role.CLIENT);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        
        userService.deleteUserAsAdmin(1L);
        
        assertFalse(user.isActive());
    }

    @Test
    void restoreUserAsAdmin_ShouldActivateUser() {
        User user = new User();
        user.setId(1L);
        user.setActive(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        
        userService.restoreUserAsAdmin(1L);
        
        assertTrue(user.isActive());
    }

    @Test
    void getAllUsers_ShouldReturnList() {
        User user = new User();
        user.setId(1L);
        when(userRepository.findAll()).thenReturn(List.of(user));

        List<UserResponse> list = userService.getAllUsers();
        assertEquals(1, list.size());
    }
}
