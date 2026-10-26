package com.sigchos.booking.modules.room_units.dto;

import com.sigchos.booking.modules.room_units.enums.RoomUnitStatus;

import jakarta.validation.constraints.NotNull;

public record RoomUnitUpdateStatusRequest(
        @NotNull RoomUnitStatus status) {

}
