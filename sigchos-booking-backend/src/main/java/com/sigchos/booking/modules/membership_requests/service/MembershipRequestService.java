package com.sigchos.booking.modules.membership_requests.service;

import com.sigchos.booking.modules.membership_requests.dto.MembershipRequestCreateRequest;
import com.sigchos.booking.modules.membership_requests.dto.MembershipRequestDecisionRequest;
import com.sigchos.booking.modules.membership_requests.dto.MembershipRequestResponse;
import com.sigchos.booking.modules.membership_requests.enums.MembershipRequestStatus;
import com.sigchos.booking.modules.membership_requests.mapper.MembershipRequestMapper;
import com.sigchos.booking.modules.membership_requests.model.MembershipRequest;
import com.sigchos.booking.modules.membership_requests.repository.MembershipRequestRepository;
import com.sigchos.booking.modules.notifications.service.EmailNotificationService;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.modules.user.repository.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class MembershipRequestService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final List<MembershipRequestStatus> OPEN_STATUSES = List.of(
            MembershipRequestStatus.PENDING,
            MembershipRequestStatus.APPROVED);

    private final MembershipRequestRepository membershipRequestRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailNotificationService emailNotificationService;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    public MembershipRequestService(
            MembershipRequestRepository membershipRequestRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailNotificationService emailNotificationService) {
        this.membershipRequestRepository = membershipRequestRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional
    public MembershipRequestResponse createRequest(MembershipRequestCreateRequest request) {
        String email = normalize(request.email());
        String ruc = normalize(request.ruc());

        if (userRepository.existsByEmail(email)
                || membershipRequestRepository.existsByEmailAndStatusIn(email, OPEN_STATUSES)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        if (userRepository.findByRuc(ruc).isPresent()
                || membershipRequestRepository.existsByRucAndStatusIn(ruc, OPEN_STATUSES)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RUC already registered");
        }

        MembershipRequest membershipRequest = MembershipRequest.builder()
                .firstName(normalizeName(request.firstName()))
                .lastName(normalizeName(request.lastName()))
                .email(email)
                .ruc(ruc)
                .status(MembershipRequestStatus.PENDING)
                .sriVerified(false)
                .build();

        return MembershipRequestMapper.toResponse(membershipRequestRepository.save(membershipRequest));
    }

    public List<MembershipRequestResponse> findByStatus(MembershipRequestStatus status) {
        if (status == null) {
            return membershipRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(MembershipRequestMapper::toResponse)
                    .toList();
        }

        return membershipRequestRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(MembershipRequestMapper::toResponse)
                .toList();
    }

    @Transactional
    public MembershipRequestResponse review(Long id, MembershipRequestDecisionRequest request, User reviewer) {
        MembershipRequest membershipRequest = requireRequest(id);

        if (membershipRequest.getStatus() != MembershipRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request already reviewed");
        }

        membershipRequest.setSriVerified(Boolean.TRUE.equals(request.sriVerified()));
        membershipRequest.setReviewNote(normalizeOptional(request.reviewNote()));
        membershipRequest.setReviewedBy(reviewer);
        membershipRequest.setReviewedAt(LocalDateTime.now());

        boolean approved = request.status() == MembershipRequestStatus.APPROVED;
        if (approved && !membershipRequest.isSriVerified()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "SRI verification is required before approval");
        }

        membershipRequest.setStatus(approved ? MembershipRequestStatus.APPROVED : MembershipRequestStatus.REJECTED);

        String tempPassword = null;
        if (approved) {
            tempPassword = createEstablishmentAdminFromRequest(membershipRequest);
        }

        MembershipRequest saved = membershipRequestRepository.save(membershipRequest);

        emailNotificationService.sendMembershipRequestReviewed(
                saved.getEmail(),
                saved.getFirstName(),
                saved.getLastName(),
                approved,
                approved ? buildLoginUrl() : null,
                tempPassword,
                saved.getReviewNote());

        return MembershipRequestMapper.toResponse(saved);
    }

    private String createEstablishmentAdminFromRequest(MembershipRequest membershipRequest) {
        if (userRepository.existsByEmail(membershipRequest.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        if (userRepository.existsByRuc(membershipRequest.getRuc())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RUC already registered");
        }

        String rawPassword = generatePassword(8);

        User user = new User();
        user.setFirstName(membershipRequest.getFirstName());
        user.setLastName(membershipRequest.getLastName());
        user.setEmail(membershipRequest.getEmail());
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setPhone("0000000000");
        user.setRuc(membershipRequest.getRuc());
        user.setBirthDate(LocalDate.of(1990, 1, 1));
        user.setRole(Role.ESTABLISHMENT_ADMIN);
        user.setActive(true);
        user.setProfileCompleted(false);
        user.setMustChangePassword(true);

        userRepository.save(user);
        return rawPassword;
    }

    private MembershipRequest requireRequest(Long id) {
        return membershipRequestRepository.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Membership request not found"));
    }

    private String normalize(String value) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Value cannot be null");
        }

        String normalized = value.trim();
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Value cannot be blank");
        }

        return normalized.toLowerCase(Locale.ROOT);
    }

    private String normalizeName(String value) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name cannot be null");
        }

        String normalized = value.trim().replaceAll("\\s+", " ");
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name cannot be blank");
        }

        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String generatePassword(int length) {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        StringBuilder builder = new StringBuilder(length);

        for (int index = 0; index < length; index++) {
            builder.append(alphabet.charAt(SECURE_RANDOM.nextInt(alphabet.length())));
        }

        return builder.toString();
    }

    private String buildLoginUrl() {
        String normalizedBaseUrl = frontendBaseUrl.endsWith("/")
                ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                : frontendBaseUrl;
        return normalizedBaseUrl + "/login";
    }
}