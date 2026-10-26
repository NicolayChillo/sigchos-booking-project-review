package com.sigchos.booking.modules.payments.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import com.sigchos.booking.modules.payments.enums.PaymentStatus;
import com.sigchos.booking.modules.payments.models.Payment;

import jakarta.persistence.LockModeType;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBooking_IdAndIdNot(Long bookingId, Long id);

    List<Payment> findByBooking_Id(Long bookingId);

    List<Payment> findByBooking_IdAndStatus(Long bookingId, PaymentStatus status);

    Optional<Payment> findByTransactionReference(String transactionReference);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.transactionReference = :ref")
    Optional<Payment> findByTransactionReferenceForUpdate(String ref);
}
