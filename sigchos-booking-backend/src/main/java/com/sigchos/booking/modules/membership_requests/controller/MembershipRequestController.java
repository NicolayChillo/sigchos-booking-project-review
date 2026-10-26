package com.sigchos.booking.modules.membership_requests.controller;

import com.sigchos.booking.modules.membership_requests.dto.MembershipRequestCreateRequest;
import com.sigchos.booking.modules.membership_requests.dto.MembershipRequestDecisionRequest;
import com.sigchos.booking.modules.membership_requests.dto.MembershipRequestResponse;
import com.sigchos.booking.modules.membership_requests.enums.MembershipRequestStatus;
import com.sigchos.booking.modules.membership_requests.service.MembershipRequestService;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.modules.user.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class MembershipRequestController {

    private final MembershipRequestService membershipRequestService;
    private final UserRepository userRepository;

    public MembershipRequestController(
            MembershipRequestService membershipRequestService,
            UserRepository userRepository) {
        this.membershipRequestService = membershipRequestService;
        this.userRepository = userRepository;
    }

    @PostMapping("/public/membership-requests")
    public MembershipRequestResponse create(@Valid @RequestBody MembershipRequestCreateRequest request) {
        return membershipRequestService.createRequest(request);
    }

    @GetMapping("/admin/membership-requests")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public List<MembershipRequestResponse> list(@RequestParam(required = false) MembershipRequestStatus status) {
        return membershipRequestService.findByStatus(status);
    }

    @PatchMapping("/admin/membership-requests/{id}/decision")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public MembershipRequestResponse review(
            @PathVariable Long id,
            @Valid @RequestBody MembershipRequestDecisionRequest request,
            Authentication authentication) {
        User reviewer = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));

        return membershipRequestService.review(id, request, reviewer);
    }
}