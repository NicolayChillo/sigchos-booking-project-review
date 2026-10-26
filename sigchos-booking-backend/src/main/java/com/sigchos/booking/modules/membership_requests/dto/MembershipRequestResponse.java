package com.sigchos.booking.modules.membership_requests.dto;

import com.sigchos.booking.modules.membership_requests.enums.MembershipRequestStatus;
import java.time.LocalDateTime;

public record MembershipRequestResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String ruc,
        MembershipRequestStatus status,
        boolean sriVerified,
        String reviewNote,
        String reviewedBy,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt) {
}