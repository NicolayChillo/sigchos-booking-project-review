package com.sigchos.booking.modules.room_types.mappers;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.room_type_images.dto.RoomTypeImageResponse;
import com.sigchos.booking.modules.room_types.enums.RoomAmenity;
import com.sigchos.booking.modules.room_types.dto.RoomTypeRequest;
import com.sigchos.booking.modules.room_types.dto.RoomTypeResponse;
import com.sigchos.booking.modules.room_types.models.RoomType;

public class RoomTypeMapper {
    public static RoomTypeResponse toResponse(RoomType entity, List<RoomTypeImageResponse> images) {
        boolean requiresAdvancePayment = Boolean.TRUE.equals(entity.getRequiresAdvancePayment());
        Set<RoomAmenity> amenities = entity.getAmenities() == null
                ? Set.of()
                : new LinkedHashSet<>(entity.getAmenities());

        return new RoomTypeResponse(
                entity.getId(),
                entity.getEstablishment().getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getCategory(),
                entity.getCapacity(),
                entity.getBedCount(),
                entity.getBedType(),
                amenities,
                entity.getPricePerNight(),
                requiresAdvancePayment,
                requiresAdvancePayment ? entity.getAdvancePaymentPercentage() : 0,
                entity.isActive(),
                images);
    }

    public static RoomType toEntity(RoomTypeRequest dto, Establishment establishment) {
        boolean requiresAdvancePayment = Boolean.TRUE.equals(dto.requiresAdvancePayment());
        Set<RoomAmenity> amenities = dto.amenities() == null ? new LinkedHashSet<>()
                : new LinkedHashSet<>(dto.amenities());

        return RoomType.builder()
                .establishment(establishment)
                .name(dto.name())
                .description(dto.description())
                .category(dto.category())
                .capacity(dto.capacity())
                .bedCount(dto.bedCount())
                .bedType(dto.bedType())
                .amenities(amenities)
                .pricePerNight(dto.pricePerNight())
                .requiresAdvancePayment(requiresAdvancePayment)
                .advancePaymentPercentage(requiresAdvancePayment ? dto.advancePaymentPercentage() : 0)
                .build();
    }
}
