package com.sigchos.booking.modules.payments.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.sigchos.booking.modules.payments.dto.BankTransferPaymentRequest;
import com.sigchos.booking.modules.payments.dto.BankTransferPaymentValidationRequest;
import com.sigchos.booking.modules.payments.dto.PaymentCheckoutResponse;
import com.sigchos.booking.modules.payments.dto.PaymentResponse;
import com.sigchos.booking.modules.payments.dto.VerifyPaymentRequest;
import com.sigchos.booking.modules.payments.enums.PaymentStatusFilter;
import com.sigchos.booking.modules.payments.services.PaymentService;
import com.sigchos.booking.modules.user.model.User;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/payments")
@AllArgsConstructor
public class PaymentController {
    private final PaymentService service;

    @GetMapping("/bookings/{bookingId}")
    @PreAuthorize("hasAnyRole('ESTABLISHMENT_ADMIN', 'CLIENT')")
    public List<PaymentResponse> findByBookingId(@PathVariable Long bookingId,
            @RequestParam(defaultValue = "ALL", required = true) PaymentStatusFilter filter) {
        return service.findByBookingId(bookingId, filter);
    }

    @PostMapping(value = "/bookings/{bookingId}/transfer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('CLIENT')")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse uploadBankTransferReceipt(@PathVariable Long bookingId,
            @ModelAttribute @Valid BankTransferPaymentRequest dto) {
        return service.uploadBankTransferReceipt(bookingId, dto);
    }

    @PatchMapping(value = "/{id}/validate")
    @PreAuthorize("hasAnyRole('ESTABLISHMENT_ADMIN')")
    public PaymentResponse validateBankTransferReceipt(@AuthenticationPrincipal User user, @PathVariable Long id,
            @RequestBody @Valid BankTransferPaymentValidationRequest dto) {
        return service.validateBankTransferReceipt(user, id, dto);
    }

    @PostMapping("/bookings/{bookingId}/checkout")
    public PaymentCheckoutResponse createPaymentCheckout(@PathVariable Long bookingId) {
        return service.createPaymentCheckout(bookingId);
    }

    @PostMapping("/checkout/process")
    public PaymentResponse processPaymentCheckout(@RequestBody @Valid VerifyPaymentRequest dto) {
        return service.processPaymentCheckout(dto);
    }

}
