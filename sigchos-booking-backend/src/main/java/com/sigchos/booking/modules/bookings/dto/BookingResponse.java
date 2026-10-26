package com.sigchos.booking.modules.bookings.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.sigchos.booking.modules.bookings.enums.BookingStatus;

public record BookingResponse(
        Long id,
        Long userId,
        Long establishmentId,
        Long roomTypeId,
        String roomTypeName,
        Long roomUnitId,
        String roomUnitCode,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        Long nights,
        BookingStatus status,
        Integer advancePaymentPercentage,
        BigDecimal advancePaymentAmount,
        BigDecimal totalAmount,
        String cancellationPolicy,
        Integer cancelPenaltyWindowHours,
        boolean cancelPenaltyAfterEnabled,
        Integer cancelPenaltyAfterPercentage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime canceledAt,
        boolean isGatewayPaymentAllowed,
        String bankName,
        String bankAccountType,
        String bankAccountNumber,
        String bankAccountOwnerName,
        String bankAccountOwnerId) {

}
