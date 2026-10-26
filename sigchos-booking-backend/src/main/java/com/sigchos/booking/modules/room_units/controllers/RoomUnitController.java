package com.sigchos.booking.modules.room_units.controllers;

import org.springframework.web.bind.annotation.RestController;

import com.sigchos.booking.enums.StatusFilter;
import com.sigchos.booking.modules.room_units.dto.RoomUnitRequest;
import com.sigchos.booking.modules.room_units.dto.RoomUnitResponse;
import com.sigchos.booking.modules.room_units.dto.RoomUnitUpdateStatusRequest;
import com.sigchos.booking.modules.room_units.services.RoomUnitService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.sigchos.booking.modules.user.model.User;

@RestController
@AllArgsConstructor
public class RoomUnitController {
    private RoomUnitService service;

    @GetMapping("room-types/{roomTypeId}/room-units")
    public List<RoomUnitResponse> findByRoomTypeId(@PathVariable Long roomTypeId,
            @RequestParam(defaultValue = "ACTIVE") StatusFilter status) {
        return service.findByRoomTypeId(roomTypeId, status);
    }

    @GetMapping("/room-units/{id}")
    public RoomUnitResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping("/room-types/{roomTypeId}/room-units")
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public RoomUnitResponse create(@AuthenticationPrincipal User user, @PathVariable Long roomTypeId,
            @RequestBody @Valid RoomUnitRequest dto) {
        return service.create(user, roomTypeId, dto);
    }

    @PutMapping("/room-types/{roomTypeId}/room-units/{id}")
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public RoomUnitResponse update(@AuthenticationPrincipal User user, @PathVariable Long roomTypeId,
            @PathVariable Long id,
            @RequestBody @Valid RoomUnitRequest dto) {
        return service.update(user, roomTypeId, id, dto);
    }

    @DeleteMapping("/room-units/{id}")
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        service.delete(user, id);
    }

    @PatchMapping("/room-units/{id}/restore")
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restore(@AuthenticationPrincipal User user, @PathVariable Long id) {
        service.restore(user, id);
    }

    @PatchMapping("/room-units/{id}/status")
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateStatus(@AuthenticationPrincipal User user, @PathVariable Long id,
            @RequestBody @Valid RoomUnitUpdateStatusRequest dto) {
        service.updateStatus(user, id, dto.status());
    }
}
