package com.sigchos.booking.modules.bookings.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BookingCreateRequest(
        @NotNull @Positive Long roomUnitId,
        @NotNull @FutureOrPresent LocalDate checkInDate,
        @NotNull @Future LocalDate checkOutDate) {

}
