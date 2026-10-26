package com.sigchos.booking.modules.membership_requests.dto;

import com.sigchos.booking.modules.membership_requests.enums.MembershipRequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MembershipRequestDecisionRequest(
        @NotNull MembershipRequestStatus status,
        @NotNull Boolean sriVerified,
        @Size(max = 500) String reviewNote) {
}