package com.sigchos.booking.modules.establishment_images.dto;

public record EstablishmentImageResponse(
        Long id,
        Long establishmentId,
        String url,
        boolean isPrimary) {

}
