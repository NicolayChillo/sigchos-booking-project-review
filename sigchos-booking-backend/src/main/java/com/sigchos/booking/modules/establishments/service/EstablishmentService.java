package com.sigchos.booking.modules.establishments.service;

import java.util.ArrayList;
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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.sigchos.booking.modules.establishment_images.dto.EstablishmentImageUpdateRequest;
import com.sigchos.booking.modules.establishment_images.mapper.EstablishmentImageMapper;
import com.sigchos.booking.modules.establishment_images.dto.EstablishmentImageRequest;
import com.sigchos.booking.modules.establishment_images.dto.EstablishmentImageResponse;
import com.sigchos.booking.modules.establishment_images.model.EstablishmentImage;
import com.sigchos.booking.modules.establishment_images.service.EstablishmentImageService;
import com.sigchos.booking.modules.establishments.dto.EstablishmentRequest;
import com.sigchos.booking.modules.establishments.dto.EstablishmentResponse;
import com.sigchos.booking.modules.establishments.dto.EstablishmentUpdateRequest;
import com.sigchos.booking.modules.establishments.mapper.EstablishmentMapper;
import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.establishments.repository.EstablishmentRepository;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.modules.establishment_services.repository.EstablishmentServicesRepository;
import com.sigchos.booking.modules.establishment_services.model.EstablishmentServices;

import lombok.AllArgsConstructor;

@Service
@Transactional(readOnly = true)
@AllArgsConstructor
public class EstablishmentService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private final EstablishmentRepository repository;
    private final EstablishmentImageService establishmentImageService;
    private final EstablishmentServicesRepository establishmentServicesRepository;

    private String normalizeName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }

    private String normalizeAddress(String address) {
        return address == null ? null : address.trim().replaceAll("\\s+", " ");
    }

    private String normalizeDescription(String description) {
        return description == null ? null : description.trim().replaceAll("\\s+", " ");
    }

    private String normalizeTime(String time) {
        return time == null ? null : time.trim();
    }

    private String normalizePolicy(String policy) {
        return policy == null ? null : policy.trim().replaceAll("\\s+", " ");
    }

    private String normalizeToken(String token) {
        return token == null || token.isBlank() ? null : token.trim();
    }

    private String normalizeStoreId(String storeId) {
        return storeId == null || storeId.isBlank() ? null : storeId.trim();
    }

    private void validateCancellationPenaltyPolicy(Boolean cancelPenaltyAfterEnabled, Integer cancelPenaltyWindowHours,
            Integer cancelPenaltyAfterPercentage) {
        boolean afterEnabled = Boolean.TRUE.equals(cancelPenaltyAfterEnabled);
        Integer windowHours = cancelPenaltyWindowHours;

        if (afterEnabled) {
            if (windowHours == null || (windowHours != 24 && windowHours != 48 && windowHours != 72)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cancellation penalty hours must be one of: 24, 48, 72");
            }
        }

        if (!afterEnabled && windowHours != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cancellation penalty hours must be empty when after-window penalty is disabled");
        }

        if (afterEnabled) {
            Integer afterPercentage = cancelPenaltyAfterPercentage;
            if (afterPercentage == null || afterPercentage < 1 || afterPercentage > 100) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "After-window cancellation penalty percentage must be between 1 and 100");
            }
        } else if (cancelPenaltyAfterPercentage != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "After-window cancellation penalty percentage must be empty when disabled");
        }
    }

    public boolean isEstablishmentNameTakenByUser(String name, Long userId) {
        return repository.existsByNameIgnoreCaseAndUser_Id(name, userId);
    }

    public List<EstablishmentResponse> findAll(User actor) {
        if (actor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }

        if (actor.getRole() != Role.ESTABLISHMENT_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only establishment admin s can list establishments");
        }

        List<Establishment> entities = repository.findByUser_Id(actor.getId());

        return entities.stream().map(e -> {
            List<EstablishmentImageResponse> images = establishmentImageService.findByEstablishmentId(e.getId());
            return EstablishmentMapper.toResponse(e, images);
        }).toList();
    }

    public List<EstablishmentResponse> findAllPublic() {
        List<Establishment> entities = repository.findAllPublicWithActiveRoomInventory();
        return entities.stream().map(e -> {
            List<EstablishmentImageResponse> images = establishmentImageService.findByEstablishmentId(e.getId());
            return EstablishmentMapper.toResponse(e, images);
        }).toList();
    }

    public EstablishmentResponse findById(Long id) {
        Establishment entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Establishment not found (id: " + id + ")"));

        List<EstablishmentImageResponse> images = establishmentImageService.findByEstablishmentId(entity.getId());
        return EstablishmentMapper.toResponse(entity, images);

    }

    public EstablishmentResponse findByIdPublic(Long id) {
        Establishment entity = repository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Establishment not found (id: " + id + ")"));

        List<EstablishmentImageResponse> images = establishmentImageService.findByEstablishmentId(entity.getId());
        return EstablishmentMapper.toResponse(entity, images);

    }

    public Establishment findActive(Long id) {
        Establishment entity = repository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Establishment not found or is inactive"));

        return entity;
    }

    private Establishment resolveManagedEstablishment(User actor, Long id) {
        if (actor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }

        Establishment found = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Establishment not found (id: " + id + ")"));

        if (actor.getRole() == Role.ESTABLISHMENT_ADMIN &&
                found.getUser() != null &&
                actor.getId().equals(found.getUser().getId())) {
            return found;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "You are not allowed to manage this establishment");
    }

    @Transactional
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public EstablishmentResponse create(User owner, EstablishmentRequest dto) {
        validateCancellationPenaltyPolicy(dto.cancelPenaltyAfterEnabled(), dto.cancelPenaltyWindowHours(),
                dto.cancelPenaltyAfterPercentage());
        String normalizedName = normalizeName(dto.name());
        if (repository.existsByNameIgnoreCaseAndUser_Id(normalizedName, owner.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Establishment name already exists (name: " + normalizedName + ")");
        }

        if (owner.getRole() != Role.ESTABLISHMENT_ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Establishment owner must be an active ESTABLISHMENT_ADMIN");
        }

        String normalizedDescription = normalizeDescription(dto.description());
        String normalizedAddress = normalizeAddress(dto.address());
        Establishment entity = EstablishmentMapper.toEntity(dto, owner);
        entity.setName(normalizedName);
        entity.setDescription(normalizedDescription);
        entity.setAddress(normalizedAddress);
        entity.setCheckInTime(normalizeTime(dto.checkInTime()));
        entity.setCheckOutTime(normalizeTime(dto.checkOutTime()));
        entity.setAdvancePaymentPolicy(normalizePolicy(dto.advancePaymentPolicy()));
        entity.setCancellationPolicy(normalizePolicy(dto.cancellationPolicy()));
        entity.setCancelPenaltyWindowHours(dto.cancelPenaltyWindowHours());
        entity.setCancelPenaltyAfterEnabled(Boolean.TRUE.equals(dto.cancelPenaltyAfterEnabled()));
        entity.setCancelPenaltyAfterPercentage(dto.cancelPenaltyAfterPercentage());
        entity.setChildrenPolicy(normalizePolicy(dto.childrenPolicy()));
        entity.setAgeRestrictionPolicy(normalizePolicy(dto.ageRestrictionPolicy()));
        entity.setPetsPolicy(normalizePolicy(dto.petsPolicy()));
        entity.setParish(dto.parish());
        entity.setLatitude(dto.latitude());
        entity.setLongitude(dto.longitude());

        Establishment saved = repository.save(entity);

        return EstablishmentMapper.toResponse(saved, new ArrayList<>());
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public EstablishmentResponse update(User actor, Long id, EstablishmentUpdateRequest dto) {
        Establishment found = resolveManagedEstablishment(actor, id);
        validateCancellationPenaltyPolicy(dto.cancelPenaltyAfterEnabled(), dto.cancelPenaltyWindowHours(),
                dto.cancelPenaltyAfterPercentage());
        Long ownerUserId = found.getUser().getId();

        String normalizedName = normalizeName(dto.name());
        if (repository.existsByNameIgnoreCaseAndIdNotAndUser_Id(normalizedName, id, ownerUserId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Establishment name already exists (name: " + normalizedName + ")");

        String normalizedDescription = normalizeDescription(dto.description());
        String normalizedAddress = normalizeAddress(dto.address());

        found.setName(normalizedName);
        found.setDescription(normalizedDescription);
        found.setAddress(normalizedAddress);
        found.setCheckInTime(normalizeTime(dto.checkInTime()));
        found.setCheckOutTime(normalizeTime(dto.checkOutTime()));
        found.setAdvancePaymentPolicy(normalizePolicy(dto.advancePaymentPolicy()));
        found.setCancellationPolicy(normalizePolicy(dto.cancellationPolicy()));
        found.setCancelPenaltyWindowHours(dto.cancelPenaltyWindowHours());
        found.setCancelPenaltyAfterEnabled(Boolean.TRUE.equals(dto.cancelPenaltyAfterEnabled()));
        found.setCancelPenaltyAfterPercentage(dto.cancelPenaltyAfterPercentage());
        found.setChildrenPolicy(normalizePolicy(dto.childrenPolicy()));
        found.setAgeRestrictionPolicy(normalizePolicy(dto.ageRestrictionPolicy()));
        found.setPetsPolicy(normalizePolicy(dto.petsPolicy()));
        // Serialize otherPolicies list to JSON string
        try {
            List<String> policies = dto.otherPolicies() == null ? List.of() : dto.otherPolicies();
            found.setOtherPolicies(policies.isEmpty() ? null : OBJECT_MAPPER.writeValueAsString(policies));
        } catch (JsonProcessingException e) {
            found.setOtherPolicies(null);
        }
        found.setParish(dto.parish());
        found.setLatitude(dto.latitude());
        found.setLongitude(dto.longitude());

        if (dto.payphoneToken() != null && !dto.payphoneToken().isBlank()) {
            found.setPayphoneToken(normalizeToken(dto.payphoneToken()));
        }

        if (dto.payphoneStoreId() != null && !dto.payphoneStoreId().isBlank()) {
            found.setPayphoneStoreId(normalizeStoreId(dto.payphoneStoreId()));
        }

        found.setBankName(dto.bankName() != null && !dto.bankName().isBlank() ? dto.bankName().trim() : null);
        found.setBankAccountType(dto.bankAccountType() != null && !dto.bankAccountType().isBlank() ? dto.bankAccountType().trim() : null);
        found.setBankAccountNumber(dto.bankAccountNumber() != null && !dto.bankAccountNumber().isBlank() ? dto.bankAccountNumber().trim() : null);
        found.setBankAccountOwnerName(dto.bankAccountOwnerName() != null && !dto.bankAccountOwnerName().isBlank() ? dto.bankAccountOwnerName().trim() : null);
        found.setBankAccountOwnerId(dto.bankAccountOwnerId() != null && !dto.bankAccountOwnerId().isBlank() ? dto.bankAccountOwnerId().trim() : null);

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

        Map<Long, EstablishmentImage> currentImagesMap = found.getImages().stream()
                .collect(Collectors.toMap(EstablishmentImage::getId, img -> img));

        for (EstablishmentImageUpdateRequest updateImageRequest : dto.images()) {
            EstablishmentImage currentImage = null;

            if (updateImageRequest.id() != null) {
                currentImage = currentImagesMap.get(updateImageRequest.id());

                if (currentImage == null) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Image (id: " + updateImageRequest.id()
                                    + ") not found in establishment (id: " + found.getId() + ")");
                }

                if (updateImageRequest.file() != null) {
                    establishmentImageService.updateEntity(currentImage, updateImageRequest);
                }
            } else {
                EstablishmentImageRequest imageRequest = new EstablishmentImageRequest(updateImageRequest.file(),
                        updateImageRequest.isPrimary());

                currentImage = establishmentImageService.createEntity(found, imageRequest);
                found.getImages().add(currentImage);
            }
        }

        repository.saveAndFlush(found);

        List<EstablishmentImageResponse> imageResponses = new ArrayList<>();

        for (EstablishmentImage img : found.getImages()) {
            String signedUrl = establishmentImageService.getSignedUrl(img);
            imageResponses.add(EstablishmentImageMapper.toResponse(img, signedUrl));
        }

        return EstablishmentMapper.toResponse(found, imageResponses);
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public void delete(User actor, Long id) {
        Establishment found = resolveManagedEstablishment(actor, id);

        if (!found.isActive())
            return;

        found.setActive(false);
        deactivateServicesOfEstablishment(found.getId());
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public void restore(User actor, Long id) {
        Establishment found = resolveManagedEstablishment(actor, id);

        if (found.isActive())
            return;

        found.setActive(true);
    }

    /**
     * Deactivates all active establishments of a given user (hotel admin),
     * and cascades the deactivation to all services of those establishments.
     * Called internally when a ESTABLISHMENT_ADMIN user is deactivated.
     */
    @Transactional
    public void deactivateAllByUserId(Long userId) {
        List<Establishment> activeEstablishments = repository.findByUser_IdAndIsActiveTrue(userId);
        if (activeEstablishments.isEmpty()) {
            return;
        }

        List<Long> establishmentIds = activeEstablishments.stream()
                .map(Establishment::getId)
                .toList();

        // Deactivate all services of these establishments
        List<EstablishmentServices> services = establishmentServicesRepository
                .findAllByEstablishment_IdIn(establishmentIds);
        services.forEach(s -> s.setActive(false));

        // Deactivate the establishments themselves
        activeEstablishments.forEach(e -> e.setActive(false));
    }

    /**
     * Deactivates all active services belonging to a single establishment.
     * Called internally when an establishment is deactivated.
     */
    private void deactivateServicesOfEstablishment(Long establishmentId) {
        List<EstablishmentServices> services = establishmentServicesRepository
                .findAllByEstablishmentIdAndIsActiveTrue(establishmentId);
        services.forEach(s -> s.setActive(false));
    }
}
