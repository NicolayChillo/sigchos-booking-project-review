package com.sigchos.booking.modules.room_type_images.dto;

public record RoomTypeImageResponse(
                Long id,
                Long roomTypeId,
                String url,
                boolean isPrimary) {

}
