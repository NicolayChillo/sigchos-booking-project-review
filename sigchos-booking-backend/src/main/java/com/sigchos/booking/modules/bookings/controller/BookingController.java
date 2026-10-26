package com.sigchos.booking.modules.bookings.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.sigchos.booking.modules.bookings.dto.BookingCreateRequest;
import com.sigchos.booking.modules.bookings.dto.BookingRescheduleRequest;
import com.sigchos.booking.modules.bookings.dto.BookingResponse;
import com.sigchos.booking.modules.bookings.enums.BookingStatus;
import com.sigchos.booking.modules.bookings.service.BookingService;
import com.sigchos.booking.modules.user.model.User;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/bookings")
@AllArgsConstructor
public class BookingController {
    private final BookingService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('CLIENT', 'ESTABLISHMENT_ADMIN')")
    public List<BookingResponse> findAllVisible(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) BookingStatus status) {
        return service.findAllVisible(user, status);
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('CLIENT', 'ESTABLISHMENT_ADMIN')")
    public List<BookingResponse> findHistory(@AuthenticationPrincipal User user) {
        return service.findHistory(user);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ESTABLISHMENT_ADMIN')")
    public BookingResponse findById(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return service.findById(user, id);
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse create(@AuthenticationPrincipal User user, @RequestBody @Valid BookingCreateRequest dto) {
        return service.create(user, dto);
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('CLIENT', 'ESTABLISHMENT_ADMIN')")
    public BookingResponse cancel(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return service.cancel(user, id);
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public BookingResponse confirm(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return service.confirm(user, id);
    }

    @PatchMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('CLIENT', 'ESTABLISHMENT_ADMIN')")
    public BookingResponse reschedule(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody @Valid BookingRescheduleRequest dto) {
        return service.reschedule(user, id, dto);
    }
}
