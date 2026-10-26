package com.sigchos.booking.modules.room_type_images.dto;

import org.springframework.web.multipart.MultipartFile;

import com.sigchos.booking.validations.File;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record RoomTypeImageRequest(
        @Schema(description = "File to upload or update current image (id not null), null to keep image") @File(contentTypes = {
                "image/png", "image/jpeg", "image/webp" }, maxSizeInMB = 5) MultipartFile file,
        @NotNull boolean isPrimary) {

}
