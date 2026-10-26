package com.sigchos.booking.modules.room_units.dto;

import com.sigchos.booking.modules.room_units.enums.RoomUnitStatus;

public record RoomUnitResponse(
        Long id,
        Long roomTypeId,
        String code,
        RoomUnitStatus status,
        boolean isActive) {

}
