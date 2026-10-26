package com.sigchos.booking.modules.room_types.controller;

import org.springframework.web.bind.annotation.RestController;

import com.sigchos.booking.enums.StatusFilter;
import com.sigchos.booking.modules.room_types.dto.RoomTypeRequest;
import com.sigchos.booking.modules.room_types.dto.RoomTypeResponse;
import com.sigchos.booking.modules.room_types.dto.RoomTypeUpdateRequest;
import com.sigchos.booking.modules.room_types.services.RoomTypeService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;

import com.sigchos.booking.modules.user.model.User;

@RestController
@AllArgsConstructor
public class RoomTypeController {
    private final RoomTypeService service;

    @GetMapping("/establishments/{establishmentId}/room-types")
    public List<RoomTypeResponse> findByEstablishmentId(@PathVariable Long establishmentId,
            @RequestParam(defaultValue = "ACTIVE") StatusFilter status) {
        return service.findByEstablishmentId(establishmentId, status);
    }

    @GetMapping("/room-types/{id}")
    public RoomTypeResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping(path = "/establishments/{establishmentId}/room-types", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    @ResponseStatus(code = HttpStatus.CREATED)
    public RoomTypeResponse create(@AuthenticationPrincipal User user, @PathVariable Long establishmentId,
            @ModelAttribute @Valid RoomTypeRequest dto) {
        return service.create(user, establishmentId, dto);
    }

    @PutMapping(path = "/establishments/{establishmentId}/room-types/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public RoomTypeResponse update(@AuthenticationPrincipal User user, @PathVariable Long establishmentId,
            @PathVariable Long id,
            @ModelAttribute @Valid RoomTypeUpdateRequest dto) {

        return service.update(user, establishmentId, id, dto);
    }

    @DeleteMapping("/room-types/{id}")
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        service.delete(user, id);
    }

    @PatchMapping("/room-types/{id}/restore")
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    public void restore(@AuthenticationPrincipal User user, @PathVariable Long id) {
        service.restore(user, id);
    }
}
