package com.sigchos.booking.validations;

import java.util.List;

import io.jsonwebtoken.lang.Arrays;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class EnumSubsetValidator implements ConstraintValidator<EnumSubset, Enum<?>> {
    private List<String> allowedValues;

    @Override
    public void initialize(EnumSubset annotation) {
        allowedValues = Arrays.asList(annotation.anyOf());
    }

    @Override
    public boolean isValid(Enum<?> value, ConstraintValidatorContext context) {
        if (value == null)
            return true;

        return allowedValues.contains(value.name());
    }

}
