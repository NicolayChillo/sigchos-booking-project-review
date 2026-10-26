package com.sigchos.booking.modules.room_units.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RoomUnitRequest(
        @NotBlank @Size(min = 1, max = 20) String code) {

}
