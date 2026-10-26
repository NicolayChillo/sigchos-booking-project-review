package com.sigchos.booking.modules.establishments.controller;

import com.sigchos.booking.modules.establishment_services.dto.EstablishmentServicesResponse;
import com.sigchos.booking.modules.establishment_services.service.EstablishmentServicesService;
import com.sigchos.booking.modules.establishments.dto.EstablishmentResponse;
import com.sigchos.booking.modules.establishments.service.EstablishmentService;
import com.sigchos.booking.modules.room_types.dto.RoomTypePublicResponse;
import com.sigchos.booking.modules.room_types.services.RoomTypeService;
import com.sigchos.booking.modules.room_units.dto.PublicRoomUnitResponse;
import com.sigchos.booking.modules.room_units.services.RoomUnitService;
import java.util.List;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/establishments")
@AllArgsConstructor
public class PublicCatalogController {

    private final EstablishmentService establishmentService;
    private final EstablishmentServicesService establishmentServicesService;
    private final RoomTypeService roomTypeService;
    private final RoomUnitService roomUnitService;

    @GetMapping
    public List<EstablishmentResponse> listActiveEstablishments() {
        return establishmentService.findAllPublic();
    }

    @GetMapping("/{id}")
    public EstablishmentResponse getActiveEstablishment(@PathVariable Long id) {
        return establishmentService.findByIdPublic(id);
    }

    @GetMapping("/{id}/services")
    public List<EstablishmentServicesResponse> listActiveServices(@PathVariable Long id) {
        return establishmentServicesService.findAllPublicByEstablishment(id);
    }

    @GetMapping("/{id}/room-types")
    public List<RoomTypePublicResponse> listActiveRoomTypes(@PathVariable Long id) {
        establishmentService.findByIdPublic(id);
        return roomTypeService.findAllPublicByEstablishment(id);
    }

    @GetMapping("/{id}/room-types/{roomTypeId}/room-units")
    public List<PublicRoomUnitResponse> listAvailableRoomUnits(
            @PathVariable Long id,
            @PathVariable Long roomTypeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate) {
        establishmentService.findByIdPublic(id);
        return roomUnitService.findPublicAvailableByEstablishmentAndRoomType(id, roomTypeId, checkInDate, checkOutDate);
    }
}
