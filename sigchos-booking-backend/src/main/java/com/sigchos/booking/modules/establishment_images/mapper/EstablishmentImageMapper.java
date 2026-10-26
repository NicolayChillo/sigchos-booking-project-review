package com.sigchos.booking.modules.establishment_images.mapper;

import com.sigchos.booking.modules.establishment_images.dto.EstablishmentImageResponse;
import com.sigchos.booking.modules.establishment_images.model.EstablishmentImage;

public class EstablishmentImageMapper {
    public static EstablishmentImageResponse toResponse(EstablishmentImage entity, String publicUrl) {
        return new EstablishmentImageResponse(
                entity.getId(),
                entity.getEstablishment().getId(),
                publicUrl,
                entity.isPrimary());
    }
}
