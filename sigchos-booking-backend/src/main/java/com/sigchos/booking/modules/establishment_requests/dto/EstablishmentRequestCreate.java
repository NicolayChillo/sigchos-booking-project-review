package com.sigchos.booking.modules.establishment_requests.dto;

import org.springframework.web.multipart.MultipartFile;

import com.sigchos.booking.validations.File;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EstablishmentRequestCreate(
                @NotBlank @Size(min = 3, max = 100) @Pattern(regexp = "^(?U)[\\p{L}0-9\\s\"'\\-.]+$") String name,
                @NotBlank @Size(min = 3, max = 255) @Pattern(regexp = "^[\\p{L}0-9\\s\"().,:;\\-]+$") String address,
                @NotNull @File(contentTypes = {
                                "application/pdf" }, message = "File must be a PDF", maxSizeInMB = 5) MultipartFile certificateFile) {

}
