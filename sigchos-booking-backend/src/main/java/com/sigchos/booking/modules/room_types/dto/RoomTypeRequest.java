package com.sigchos.booking.modules.room_types.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import com.sigchos.booking.modules.room_type_images.dto.RoomTypeImageRequest;
import com.sigchos.booking.modules.room_types.enums.RoomAmenity;
import com.sigchos.booking.modules.room_types.enums.RoomBedType;
import com.sigchos.booking.modules.room_types.enums.RoomCategory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record RoomTypeRequest(
        @NotBlank @Size(min = 3, max = 255) @Pattern(regexp = "^[\\p{L}0-9\\s\"()/.,\\-+]+$") String name,
        @NotBlank @Size(min = 3, max = 255) @Pattern(regexp = "^[\\p{L}0-9\\s\"()/.,\\-+]+$") String description,
        @NotNull RoomCategory category,
        @NotNull @Positive Integer capacity,
        @NotNull @Positive Integer bedCount,
        @NotNull RoomBedType bedType,
        @Size(max = 14) Set<RoomAmenity> amenities,
        @NotNull @Positive @Digits(integer = 8, fraction = 2) BigDecimal pricePerNight,
        @NotNull Boolean requiresAdvancePayment,
        @Min(1) @Max(100) Integer advancePaymentPercentage,
        @Valid List<RoomTypeImageRequest> images) {

    public RoomTypeRequest {
        if (images == null) {
            images = List.of();
        }
    }
}
