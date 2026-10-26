package com.sigchos.booking.modules.establishments.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sigchos.booking.modules.establishments.dto.EstablishmentResponse;
import com.sigchos.booking.modules.establishments.dto.EstablishmentUpdateRequest;
import com.sigchos.booking.modules.establishments.service.EstablishmentService;
import com.sigchos.booking.modules.user.model.User;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/establishments")
@AllArgsConstructor
public class EstablishmentController {
    private final EstablishmentService service;

    @GetMapping
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public List<EstablishmentResponse> findAll(@AuthenticationPrincipal User user) {
        return service.findAll(user);
    }

    @GetMapping("/{id}")
    public EstablishmentResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public EstablishmentResponse update(@AuthenticationPrincipal User user, @PathVariable Long id,
            @ModelAttribute @Valid EstablishmentUpdateRequest dto) {
        return service.update(user, id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public void delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        service.delete(user, id);
    }

    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public void restore(@AuthenticationPrincipal User user, @PathVariable Long id) {
        service.restore(user, id);
    }
}
