package com.sigchos.booking.modules.room_units.mapper;

import com.sigchos.booking.modules.room_types.models.RoomType;
import com.sigchos.booking.modules.room_units.dto.RoomUnitRequest;
import com.sigchos.booking.modules.room_units.dto.RoomUnitResponse;
import com.sigchos.booking.modules.room_units.model.RoomUnit;

public class RoomUnitMapper {
    public static RoomUnitResponse toResponse(RoomUnit entity) {
        return new RoomUnitResponse(
                entity.getId(),
                entity.getType().getId(),
                entity.getCode(),
                entity.getStatus(),
                entity.isActive());
    }

    public static RoomUnit toEntity(RoomUnitRequest dto, RoomType type) {
        return RoomUnit.builder()
                .type(type)
                .code(dto.code())
                .build();
    }
}
