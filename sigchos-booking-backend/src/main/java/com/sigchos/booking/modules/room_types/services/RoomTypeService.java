package com.sigchos.booking.modules.room_types.services;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.enums.StatusFilter;
import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.establishments.service.EstablishmentService;
import com.sigchos.booking.modules.room_types.enums.RoomAmenity;
import com.sigchos.booking.modules.room_types.dto.RoomTypePublicResponse;
import com.sigchos.booking.modules.room_types.dto.RoomTypeRequest;
import com.sigchos.booking.modules.room_types.dto.RoomTypeResponse;
import com.sigchos.booking.modules.room_types.dto.RoomTypeUpdateRequest;
import com.sigchos.booking.modules.room_types.mappers.RoomTypeMapper;
import com.sigchos.booking.modules.room_types.models.RoomType;
import com.sigchos.booking.modules.room_types.repository.RoomTypeRepository;
import com.sigchos.booking.modules.room_units.enums.RoomUnitStatus;
import com.sigchos.booking.modules.room_units.repository.RoomUnitRepository;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.room_type_images.dto.RoomTypeImageRequest;
import com.sigchos.booking.modules.room_type_images.dto.RoomTypeImageResponse;
import com.sigchos.booking.modules.room_type_images.dto.RoomTypeImageUpdateRequest;
import com.sigchos.booking.modules.room_type_images.mapper.RoomTypeImageMapper;
import com.sigchos.booking.modules.room_type_images.models.RoomTypeImage;
import com.sigchos.booking.modules.room_type_images.service.RoomTypeImageService;
import com.sigchos.booking.modules.user.model.User;

import lombok.AllArgsConstructor;

@Service
@Transactional(readOnly = true)
@AllArgsConstructor
public class RoomTypeService {
    private final RoomTypeRepository repository;
    private final EstablishmentService establishmentService;
    private final RoomUnitRepository roomUnitRepository;
    private final RoomTypeImageService roomTypeImageService;

    public String normalizeName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }

    public String normalizeDescription(String description) {
        return description.trim().replaceAll("\\s+", " ");
    }

    private int resolveAdvancePaymentPercentage(boolean requiresAdvancePayment, Integer advancePaymentPercentage) {
        if (!Boolean.TRUE.equals(requiresAdvancePayment)) {
            return 0;
        }

        if (advancePaymentPercentage == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "advancePaymentPercentage is required when requiresAdvancePayment is true");
        }

        return advancePaymentPercentage;
    }

    private Set<RoomAmenity> normalizeAmenities(Set<RoomAmenity> amenities) {
        if (amenities == null) {
            return new LinkedHashSet<>();
        }

        if (amenities.contains(null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "amenities contains invalid null values");
        }

        return new LinkedHashSet<>(amenities);
    }

    public List<RoomTypeResponse> findByEstablishmentId(Long establishmentId, StatusFilter status) {
        List<RoomType> rooms;

        switch (status) {
            case ACTIVE -> rooms = repository.findByEstablishment_IdAndIsActiveTrue(establishmentId);
            case INACTIVE -> rooms = repository.findByEstablishment_IdAndIsActiveFalse(establishmentId);
            case ALL -> rooms = repository.findByEstablishment_Id(establishmentId);
            default -> rooms = repository.findByEstablishment_IdAndIsActiveTrue(establishmentId);
        }

        return rooms.stream().map((e) -> {
            List<RoomTypeImageResponse> images = roomTypeImageService.findByRoomTypeId(e.getId());
            return RoomTypeMapper.toResponse(e, images);
        }).toList();
    }

    public List<RoomTypePublicResponse> findAllPublicByEstablishment(Long establishmentId) {
        List<RoomType> rooms = repository.findByEstablishment_IdAndIsActiveTrue(establishmentId);

        return rooms.stream().map(room -> {
            List<RoomTypeImageResponse> images = roomTypeImageService.findByRoomTypeId(room.getId());

            return new RoomTypePublicResponse(
                    room.getId(),
                    room.getEstablishment().getId(),
                    room.getName(),
                    room.getDescription(),
                    room.getCategory(),
                    room.getCapacity(),
                    room.getBedCount(),
                    room.getBedType(),
                    room.getAmenities() == null ? Set.of() : new LinkedHashSet<>(room.getAmenities()),
                    room.getPricePerNight(),
                    Boolean.TRUE.equals(room.getRequiresAdvancePayment()),
                    Boolean.TRUE.equals(room.getRequiresAdvancePayment())
                            ? room.getAdvancePaymentPercentage()
                            : 0,
                    roomUnitRepository.existsByType_IdAndIsActiveTrueAndStatus(room.getId(), RoomUnitStatus.AVAILABLE),
                    images);
        }).toList();
    }

    public RoomTypeResponse findById(Long id) {
        RoomType room = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room type not found"));

        List<RoomTypeImageResponse> images = roomTypeImageService.findByRoomTypeId(room.getId());

        return RoomTypeMapper.toResponse(room, images);
    }

    public RoomType findActive(Long id) {
        RoomType room = repository.findByIdAndIsActiveTrue(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room type not found or is inactive"));

        return room;
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
                "You are not allowed to manage room types for this establishment");
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public RoomTypeResponse create(User actor, Long establishmentId, RoomTypeRequest dto) {
        Establishment establishment = establishmentService.findActive(establishmentId);
        ensureActorCanManageEstablishment(actor, establishment);

        String normalizedName = normalizeName(dto.name());

        if (repository.existsByEstablishment_IdAndNameIgnoreCase(establishmentId, normalizedName))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Name already exists in establishment");

        RoomType entity = RoomTypeMapper.toEntity(dto, establishment);
        entity.setName(normalizedName);
        entity.setDescription(normalizeDescription(entity.getDescription()));
        entity.setBedCount(dto.bedCount());
        entity.setBedType(dto.bedType());
        entity.setAmenities(normalizeAmenities(dto.amenities()));
        entity.setRequiresAdvancePayment(Boolean.TRUE.equals(dto.requiresAdvancePayment()));
        entity.setAdvancePaymentPercentage(
                resolveAdvancePaymentPercentage(dto.requiresAdvancePayment(), dto.advancePaymentPercentage()));

        RoomType saved = repository.save(entity);

        List<RoomTypeImageResponse> imageResponses = new ArrayList<>();

        for (RoomTypeImageRequest imageRequest : dto.images()) {
            RoomTypeImageResponse imageResponse = roomTypeImageService.create(saved, imageRequest);
            imageResponses.add(imageResponse);
        }

        return RoomTypeMapper.toResponse(entity, imageResponses);
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public RoomTypeResponse update(User actor, Long establishmentId, Long id, RoomTypeUpdateRequest dto) {
        RoomType found = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room type not found"));

        ensureActorCanManageEstablishment(actor, found.getEstablishment());

        if (!establishmentId.equals(found.getEstablishment().getId()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room type is not part of the establishment");

        String normalizedName = normalizeName(dto.name());
        String normalizedDescription = normalizeDescription(dto.description());

        if (repository.existsByEstablishment_IdAndNameIgnoreCaseAndIdNot(establishmentId, normalizedName, id))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Name already exists in establishment");

        found.setName(normalizedName);
        found.setDescription(normalizeDescription(normalizedDescription));
        found.setCategory(dto.category());
        found.setCapacity(dto.capacity());
        found.setBedCount(dto.bedCount());
        found.setBedType(dto.bedType());
        found.setAmenities(normalizeAmenities(dto.amenities()));
        found.setPricePerNight(dto.pricePerNight());
        found.setRequiresAdvancePayment(Boolean.TRUE.equals(dto.requiresAdvancePayment()));
        found.setAdvancePaymentPercentage(
                resolveAdvancePaymentPercentage(dto.requiresAdvancePayment(), dto.advancePaymentPercentage()));

        long primaryImageCount = dto.images().stream()
                .filter(img -> img.isPrimary())
                .count();

        if (!dto.images().isEmpty() && primaryImageCount != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "There must be exactly one primary image. Found: " + primaryImageCount);
        }

        Set<Long> incomingImagesId = dto.images()
                .stream().map(img -> img.id()).filter(Objects::nonNull).collect(Collectors.toSet());

        found.getImages().removeIf(img -> !incomingImagesId.contains(img.getId()));

        Map<Long, RoomTypeImage> currentImagesMap = found.getImages().stream()
                .collect(Collectors.toMap(RoomTypeImage::getId, img -> img));

        for (RoomTypeImageUpdateRequest updateImageRequest : dto.images()) {
            RoomTypeImage currentImage = null;

            if (updateImageRequest.id() != null) {
                currentImage = currentImagesMap.get(updateImageRequest.id());

                if (currentImage == null) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Image (id: " + updateImageRequest.id()
                                    + ") not found in room type (id: " + found.getId() + ")");
                }

                if (updateImageRequest.file() != null) {
                    roomTypeImageService.updateEntity(currentImage, updateImageRequest);
                }
            } else {
                RoomTypeImageRequest imageRequest = new RoomTypeImageRequest(updateImageRequest.file(),
                        updateImageRequest.isPrimary());

                currentImage = roomTypeImageService.createEntity(found, imageRequest);
                found.getImages().add(currentImage);
            }
        }

        repository.saveAndFlush(found);

        List<RoomTypeImageResponse> imageResponses = new ArrayList<>();

        for (RoomTypeImage img : found.getImages()) {
            String signedUrl = roomTypeImageService.getSignedUrl(img);
            imageResponses.add(RoomTypeImageMapper.toResponse(img, signedUrl));
        }

        return RoomTypeMapper.toResponse(found, imageResponses);

    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public void delete(User actor, Long id) {
        RoomType found = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room type not found"));

        ensureActorCanManageEstablishment(actor, found.getEstablishment());

        if (!found.isActive())
            return;

        found.setActive(false);
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public void restore(User actor, Long id) {
        RoomType found = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room type not found"));

        ensureActorCanManageEstablishment(actor, found.getEstablishment());

        if (found.isActive())
            return;

        found.setActive(true);
    }
}
