package com.sigchos.booking.modules.membership_requests.repository;

import com.sigchos.booking.modules.membership_requests.enums.MembershipRequestStatus;
import com.sigchos.booking.modules.membership_requests.model.MembershipRequest;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MembershipRequestRepository extends JpaRepository<MembershipRequest, Long> {

    boolean existsByEmailAndStatusIn(String email, Collection<MembershipRequestStatus> statuses);

    boolean existsByRucAndStatusIn(String ruc, Collection<MembershipRequestStatus> statuses);

    List<MembershipRequest> findAllByOrderByCreatedAtDesc();

    List<MembershipRequest> findByStatusOrderByCreatedAtDesc(MembershipRequestStatus status);
}