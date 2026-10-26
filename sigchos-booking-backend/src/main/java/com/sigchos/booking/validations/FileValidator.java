package com.sigchos.booking.validations;

import java.util.Arrays;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class FileValidator implements ConstraintValidator<File, MultipartFile> {
    private String[] contentTypes;
    private long maxSizeInBytes;

    @Override
    public void initialize(File constraintAnnotation) {
        contentTypes = constraintAnnotation.contentTypes();
        maxSizeInBytes = constraintAnnotation.maxSizeInMB() * 1024 * 1024;
    }

    @Override
    public boolean isValid(MultipartFile file, ConstraintValidatorContext context) {
        if (file == null)
            return true;

        context.disableDefaultConstraintViolation();

        if (file.isEmpty()) {
            context.buildConstraintViolationWithTemplate("Empty file").addConstraintViolation();
            return false;
        }

        if (file.getSize() > maxSizeInBytes) {
            context.buildConstraintViolationWithTemplate(
                    String.format("File exceeds the %d MB", maxSizeInBytes / (1024 * 1024)))
                    .addConstraintViolation();
            return false;
        }

        if (contentTypes.length == 0)
            return true;

        String contentType = file.getContentType();

        boolean isAllowedContentType = Arrays.stream(contentTypes)
                .anyMatch(mime -> mime.equalsIgnoreCase(contentType));

        if (!isAllowedContentType) {
            context.buildConstraintViolationWithTemplate(
                    String.format("Content type '%s' is not allowed",
                            contentType))
                    .addConstraintViolation();
        }

        return isAllowedContentType;
    }

}
