package com.sigchos.booking.modules.membership_requests.mapper;

import com.sigchos.booking.modules.membership_requests.dto.MembershipRequestResponse;
import com.sigchos.booking.modules.membership_requests.model.MembershipRequest;

public final class MembershipRequestMapper {

    private MembershipRequestMapper() {
    }

    public static MembershipRequestResponse toResponse(MembershipRequest request) {
        return new MembershipRequestResponse(
                request.getId(),
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                request.getRuc(),
                request.getStatus(),
                request.isSriVerified(),
                request.getReviewNote(),
                request.getReviewedBy() == null ? null
                        : request.getReviewedBy().getFirstName() + " " + request.getReviewedBy().getLastName(),
                request.getCreatedAt(),
                request.getReviewedAt());
    }
}