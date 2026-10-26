package com.sigchos.booking.modules.user.service;

import com.sigchos.booking.modules.auth.dto.AuthResponse;
import com.sigchos.booking.modules.auth.dto.LoginRequest;
import com.sigchos.booking.modules.auth.dto.RegisterRequest;
import com.sigchos.booking.modules.auth.security.JwtService;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.user.dto.AdminCreateUserRequest;
import com.sigchos.booking.modules.user.dto.AdminUpdateUserRequest;
import com.sigchos.booking.modules.user.dto.ChangePasswordRequest;
import com.sigchos.booking.modules.user.dto.OnboardingCompleteRequest;
import com.sigchos.booking.modules.user.dto.ProfileUpdateRequest;
import com.sigchos.booking.modules.user.dto.UserResponse;
import com.sigchos.booking.modules.user.mapper.UserMapper;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.modules.user.repository.UserRepository;
import com.sigchos.booking.modules.establishments.service.EstablishmentService;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Value;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.util.Collections;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final String googleClientId;
    private final EstablishmentService establishmentService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            @Value("${google.client-id}") String googleClientId,
            EstablishmentService establishmentService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.googleClientId = googleClientId;
        this.establishmentService = establishmentService;
    }

    @Transactional
    public UserResponse registerClient(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone().trim());
        user.setRuc(null);
        user.setBirthDate(request.getBirthDate());
        user.setRole(Role.CLIENT);
        user.setActive(true);
        user.setProfileCompleted(true);
        user.setMustChangePassword(false);
        user.setHasPassword(true);

        return UserMapper.toResponse(userRepository.save(user));
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());

        // Pre-check: verify user existence and account status before delegating to Spring Security,
        // so we can surface specific, descriptive error messages instead of a generic 401.
        User preCheckUser = userRepository.findByEmail(email).orElse(null);
        if (preCheckUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "No existe una cuenta registrada con ese correo electrónico");
        }
        if (!preCheckUser.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Usuario inactivo. Contactate con el administrador");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Contraseña incorrecta. Verifica tus datos e intenta nuevamente");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email user not found"));

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        extraClaims.put("role", user.getRole().name());

        String token = jwtService.generateToken(extraClaims, user);
        return new AuthResponse(token, UserMapper.toResponse(user));
    }

    @Transactional
    public AuthResponse loginWithGoogle(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google ID Token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = normalizeEmail(payload.getEmail());

            String firstName = (String) payload.get("given_name");
            String lastName = (String) payload.get("family_name");

            if (firstName == null || firstName.isBlank()) {
                firstName = "Usuario";
            }
            if (lastName == null || lastName.isBlank()) {
                lastName = "Google";
            }

            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                user = new User();
                user.setFirstName(firstName.trim());
                user.setLastName(lastName.trim());
                user.setEmail(email);
                user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
                user.setPhone("");
                user.setRuc(null);
                user.setBirthDate(LocalDate.of(2000, 1, 1));
                user.setRole(Role.CLIENT);
                user.setActive(true);
                user.setProfileCompleted(false);
                user.setMustChangePassword(false);
                user.setHasPassword(false);
                user = userRepository.save(user);
            } else {
                if (!user.isActive()) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User account is suspended");
                }
            }

            Map<String, Object> extraClaims = new HashMap<>();
            extraClaims.put("userId", user.getId());
            extraClaims.put("role", user.getRole().name());

            String token = jwtService.generateToken(extraClaims, user);
            return new AuthResponse(token, UserMapper.toResponse(user));

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error validating Google token", e);
        }
    }

    public UserResponse getProfile(String email) {
        return UserMapper.toResponse(requireUserByEmail(email));
    }

    @Transactional
    public UserResponse updateOwnProfile(String email, ProfileUpdateRequest request) {
        User user = requireUserByEmail(email);

        if (request.getEmail() != null) {
            String normalizedEmail = normalizeEmail(request.getEmail());
            if (normalizedEmail == null || normalizedEmail.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email cannot be blank");
            }

            if (!user.getEmail().equals(normalizedEmail) && userRepository.existsByEmail(normalizedEmail)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
            }

            user.setEmail(normalizedEmail);
        }

        applyNonBlankPatch(request.getFirstName(), user::setFirstName, "firstName");
        applyNonBlankPatch(request.getLastName(), user::setLastName, "lastName");
        applyNonBlankPatch(request.getPhone(), user::setPhone, "phone");

        if (request.getBirthDate() != null) {
            user.setBirthDate(request.getBirthDate());
        }

        if (!user.isProfileCompleted() &&
                user.getFirstName() != null && !user.getFirstName().isBlank() &&
                user.getLastName() != null && !user.getLastName().isBlank() &&
                user.getPhone() != null && !user.getPhone().isBlank() &&
                user.getBirthDate() != null) {
            user.setProfileCompleted(true);
        }

        return UserMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void changeOwnPassword(String email, ChangePasswordRequest request) {
        User user = requireUserByEmail(email);

        if (user.isHasPassword()) {
            // Usuario con contraseña local: validar contraseña actual
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is required");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
            }
            if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "New password must be different from current password");
            }
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setHasPassword(true);
    }

    @Transactional
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public UserResponse createUserAsAdmin(AdminCreateUserRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone().trim());
        user.setBirthDate(request.getBirthDate());
        user.setRole(request.getRole());
        user.setActive(request.getActive() == null || request.getActive());
        user.setProfileCompleted(true);
        user.setMustChangePassword(false);

        if (request.getRole() == Role.ESTABLISHMENT_ADMIN) {
            user.setRuc(requireNonBlankRuc(request.getRuc(), "Hotel admin users must have a RUC"));
        } else {
            user.setRuc(
                    request.getRuc() == null || request.getRuc().isBlank()
                            ? null
                            : request.getRuc().trim());
        }

        return UserMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public UserResponse updateUserAsAdmin(Long id, AdminUpdateUserRequest request) {
        User user = requireUserById(id);

        if (request.getEmail() != null) {
            String email = normalizeEmail(request.getEmail());
            if (email == null || email.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email cannot be blank");
            }

            if (!user.getEmail().equals(email) && userRepository.existsByEmail(email)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
            }

            user.setEmail(email);
        }

        applyNonBlankPatch(request.getFirstName(), user::setFirstName, "firstName");
        applyNonBlankPatch(request.getLastName(), user::setLastName, "lastName");
        applyNonBlankPatch(request.getPhone(), user::setPhone, "phone");

        if (request.getBirthDate() != null) {
            user.setBirthDate(request.getBirthDate());
        }

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        if (request.getPassword() != null) {
            if (request.getPassword().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password cannot be blank");
            }

            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRuc() != null) {
            String normalizedRuc = request.getRuc().trim();
            if (normalizedRuc.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ruc cannot be blank");
            }

            user.setRuc(normalizedRuc);
        }

        ensureEstablishmentAdminHasRuc(user);

        return UserMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse completeOnboarding(String email, OnboardingCompleteRequest request) {
        User user = requireUserByEmail(email);

        if (user.getRole() != Role.ESTABLISHMENT_ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Onboarding is only available for hotel admins");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        user.setFirstName(normalizeNonBlankField(request.firstName(), "firstName"));
        user.setLastName(normalizeNonBlankField(request.lastName(), "lastName"));
        user.setPhone(normalizeNonBlankField(request.phone(), "phone"));

        if (request.birthDate() != null) {
            user.setBirthDate(request.birthDate());
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setProfileCompleted(true);
        user.setMustChangePassword(false);

        return UserMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public void deleteUserAsAdmin(Long id) {
        User user = requireUserById(id);

        if (!user.isActive()) {
            return;
        }

        // If the user is a hotel admin, cascade deactivation to their establishments and services
        if (user.getRole() == Role.ESTABLISHMENT_ADMIN) {
            establishmentService.deactivateAllByUserId(user.getId());
        }

        user.setActive(false);
    }

    @Transactional
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public void restoreUserAsAdmin(Long id) {
        User user = requireUserById(id);

        if (user.isActive()) {
            return;
        }

        user.setActive(true);
    }

    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserMapper::toResponse)
                .collect(Collectors.toList());
    }

    private User requireUserByEmail(String email) {
        String normalized = normalizeEmail(email);
        return userRepository.findByEmail(normalized)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private User requireUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeNonBlankField(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " cannot be blank");
        }

        return value.trim().replaceAll("\\s+", " ");
    }

    private void applyNonBlankPatch(String value, Consumer<String> setter, String fieldName) {
        if (value == null) {
            return;
        }

        setter.accept(normalizeNonBlankField(value, fieldName));
    }

    private static final int RUC_MIN_LENGTH = 10;

    private String requireNonBlankRuc(String ruc, String message) {
        if (ruc == null || ruc.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }

        String normalized = ruc.trim();
        if (normalized.length() < RUC_MIN_LENGTH) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "RUC must be at least " + RUC_MIN_LENGTH + " characters");
        }

        return normalized;
    }

    private void ensureEstablishmentAdminHasRuc(User user) {
        if (user.getRole() != Role.ESTABLISHMENT_ADMIN) {
            return;
        }

        if (user.getRuc() == null || user.getRuc().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Hotel admin users must have a RUC");
        }

        if (user.getRuc().trim().length() < RUC_MIN_LENGTH) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "RUC must be at least " + RUC_MIN_LENGTH + " characters");
        }
    }

    public User findActiveEntity(Long id) {
        return userRepository.findByIdAndActiveTrue(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "User not found or is inactive"));
    }
}
