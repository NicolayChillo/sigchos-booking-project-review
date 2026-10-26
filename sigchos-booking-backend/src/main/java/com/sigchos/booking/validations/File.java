package com.sigchos.booking.validations;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Constraint(validatedBy = FileValidator.class)
public @interface File {
    String message() default "Invalid file extension";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    String[] contentTypes() default {};

    long maxSizeInMB() default 2;
}