package com.sigchos.booking.modules.bookings.mapper;

import java.time.temporal.ChronoUnit;

import com.sigchos.booking.modules.bookings.dto.BookingResponse;
import com.sigchos.booking.modules.bookings.model.Booking;

public class BookingMapper {

    private BookingMapper() {
    }

    public static BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getUser().getId(),
                booking.getEstablishment().getId(),
                booking.getRoomUnit().getType().getId(),
                booking.getRoomUnit().getType().getName(),
                booking.getRoomUnit().getId(),
                booking.getRoomUnit().getCode(),
                booking.getCheckInDate(),
                booking.getCheckOutDate(),
                ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate()),
                booking.getStatus(),
                booking.getAdvancePaymentPercentage(),
                booking.getAdvancePaymentAmount(),
                booking.getTotalAmount(),
                booking.getEstablishment().getCancellationPolicy(),
                booking.getEstablishment().getCancelPenaltyWindowHours(),
                booking.getEstablishment().isCancelPenaltyAfterEnabled(),
                booking.getEstablishment().getCancelPenaltyAfterPercentage(),
                booking.getCreatedAt(),
                booking.getUpdatedAt(),
                booking.getCanceledAt(),
                booking.getEstablishment().hasGatewayAvailable(),
                booking.getEstablishment().getBankName(),
                booking.getEstablishment().getBankAccountType(),
                booking.getEstablishment().getBankAccountNumber(),
                booking.getEstablishment().getBankAccountOwnerName(),
                booking.getEstablishment().getBankAccountOwnerId());
    }
}
