package com.sigchos.booking.modules.establishment_images.dto;

import org.springframework.web.multipart.MultipartFile;

import com.sigchos.booking.validations.File;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record EstablishmentImageUpdateRequest(
        @Schema(description = "Image id for existing images, null field otherwise") Long id,
        @Schema(description = "File to update current image (id required), null to keep current image") @File(contentTypes = {
                "image/png", "image/jpeg", "image/webp" }, maxSizeInMB = 5) MultipartFile file,
        @NotNull Boolean isPrimary) {

}
