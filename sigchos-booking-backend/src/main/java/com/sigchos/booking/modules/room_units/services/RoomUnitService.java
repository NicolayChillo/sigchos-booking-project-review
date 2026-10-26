package com.sigchos.booking.modules.room_units.services;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.enums.StatusFilter;
import com.sigchos.booking.modules.bookings.enums.BookingStatus;
import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.room_units.dto.PublicRoomUnitResponse;
import com.sigchos.booking.modules.room_types.models.RoomType;
import com.sigchos.booking.modules.room_types.services.RoomTypeService;
import com.sigchos.booking.modules.room_units.dto.RoomUnitRequest;
import com.sigchos.booking.modules.room_units.dto.RoomUnitResponse;
import com.sigchos.booking.modules.room_units.enums.RoomUnitStatus;
import com.sigchos.booking.modules.room_units.mapper.RoomUnitMapper;
import com.sigchos.booking.modules.room_units.model.RoomUnit;
import com.sigchos.booking.modules.room_units.repository.RoomUnitRepository;
import com.sigchos.booking.modules.user.model.User;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
@Transactional(readOnly = true)
public class RoomUnitService {
    private static final List<BookingStatus> BLOCKING_BOOKING_STATUSES = List.of(
            BookingStatus.PENDING,
            BookingStatus.ADVANCE_CONFIRMED,
            BookingStatus.COMPLETED);

    private final RoomUnitRepository repository;
    private final RoomTypeService roomTypeService;

    public String normalizeCode(String code) {
        return code.trim();
    }

    public List<RoomUnitResponse> findByRoomTypeId(Long roomTypeId, StatusFilter status) {
        List<RoomUnit> units;

        switch (status) {
            case ACTIVE -> units = repository.findByType_IdAndIsActiveTrue(roomTypeId);
            case INACTIVE -> units = repository.findByType_IdAndIsActiveFalse(roomTypeId);
            case ALL -> units = repository.findByType_Id(roomTypeId);
            default -> units = repository.findByType_IdAndIsActiveTrue(roomTypeId);
        }

        return units.stream().map(RoomUnitMapper::toResponse).toList();
    }

    public RoomUnitResponse findById(Long id) {
        RoomUnit found = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room unit not found"));

        return RoomUnitMapper.toResponse(found);
    }

    public List<PublicRoomUnitResponse> findPublicAvailableByEstablishmentAndRoomType(
            Long establishmentId,
            Long roomTypeId,
            LocalDate checkInDate,
            LocalDate checkOutDate) {
        RoomType roomType = roomTypeService.findActive(roomTypeId);

        if (!roomType.getEstablishment().getId().equals(establishmentId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Room type is not part of the requested establishment");
        }

        List<RoomUnit> units;

        if (checkInDate != null && checkOutDate != null) {
            if (!checkInDate.isBefore(checkOutDate)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "checkInDate must be earlier than checkOutDate");
            }

            units = repository.findAvailableByRoomTypeAndDateRange(
                    roomTypeId,
                    RoomUnitStatus.AVAILABLE,
                    BLOCKING_BOOKING_STATUSES,
                    checkInDate,
                    checkOutDate);
        } else {
            units = repository.findByType_IdAndIsActiveTrueAndStatusOrderByCodeAsc(
                    roomTypeId,
                    RoomUnitStatus.AVAILABLE);
        }

        return units.stream()
                .map(unit -> new PublicRoomUnitResponse(unit.getId(), roomTypeId, unit.getCode()))
                .toList();
    }

    private void ensureActorCanManageEstablishment(User actor, Establishment establishment) {
        if (actor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }

        if (actor.getRole() == Role.ESTABLISHMENT_ADMIN &&
                establishment.getUser() != null &&
                actor.getId().equals(establishment.getUser().getId())) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "You are not allowed to manage room units for this establishment");
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public RoomUnitResponse create(User actor, Long roomTypeId, RoomUnitRequest dto) {
        RoomType type = roomTypeService.findActive(roomTypeId);
        ensureActorCanManageEstablishment(actor, type.getEstablishment());

        String normalizedCode = normalizeCode(dto.code());

        if (repository.existsByCodeIgnoreCaseAndType_Establishment_Id(normalizedCode, type.getEstablishment().getId()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Another room already use this code in the establishment");

        RoomUnit entity = RoomUnitMapper.toEntity(dto, type);
        entity.setCode(normalizedCode);

        RoomUnit saved = repository.save(entity);

        return RoomUnitMapper.toResponse(saved);
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public RoomUnitResponse update(User actor, Long roomTypeId, Long id, RoomUnitRequest dto) {
        RoomUnit found = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room unit not found"));

        ensureActorCanManageEstablishment(actor, found.getType().getEstablishment());

        if (!found.getType().getId().equals(roomTypeId)) {
            RoomType type = roomTypeService.findActive(roomTypeId);

            ensureActorCanManageEstablishment(actor, type.getEstablishment());

            if (!type.getEstablishment().getId().equals(found.getType().getEstablishment().getId()))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Room type is not part of the same establishment");

            found.setType(type);
        }

        String normalizedCode = normalizeCode(dto.code());

        if (repository.existsByCodeIgnoreCaseAndType_Establishment_IdAndIdNot(
                normalizedCode,
                found.getType().getEstablishment().getId(),
                id))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Another room already use this code in the establishment");

        found.setCode(normalizedCode);

        return RoomUnitMapper.toResponse(found);
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public void delete(User actor, Long id) {
        RoomUnit found = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room unit not found"));

        ensureActorCanManageEstablishment(actor, found.getType().getEstablishment());

        if (!found.isActive())
            return;

        found.setActive(false);
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public void restore(User actor, Long id) {
        RoomUnit found = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room unit not found"));

        ensureActorCanManageEstablishment(actor, found.getType().getEstablishment());

        if (found.isActive())
            return;

        found.setActive(true);
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public void updateStatus(User actor, Long id, RoomUnitStatus status) {
        RoomUnit found = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room unit not found"));

        ensureActorCanManageEstablishment(actor, found.getType().getEstablishment());

        if (found.getStatus() == status)
            return;

        found.setStatus(status);
    }
}
