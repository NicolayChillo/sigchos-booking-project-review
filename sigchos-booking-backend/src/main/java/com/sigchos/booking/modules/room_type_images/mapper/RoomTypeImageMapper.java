package com.sigchos.booking.modules.room_type_images.mapper;

import com.sigchos.booking.modules.room_type_images.dto.RoomTypeImageResponse;
import com.sigchos.booking.modules.room_type_images.models.RoomTypeImage;

public class RoomTypeImageMapper {
    public static RoomTypeImageResponse toResponse(RoomTypeImage entity, String publicUrl) {
        return new RoomTypeImageResponse(
                entity.getId(),
                entity.getRoomType().getId(),
                publicUrl,
                entity.isPrimary());
    }
}
