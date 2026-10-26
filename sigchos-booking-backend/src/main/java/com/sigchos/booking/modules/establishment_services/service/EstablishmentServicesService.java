package com.sigchos.booking.modules.establishment_services.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.establishments.repository.EstablishmentRepository;
import com.sigchos.booking.modules.establishment_services.dto.EstablishmentServicesRequest;
import com.sigchos.booking.modules.establishment_services.dto.EstablishmentServicesResponse;
import com.sigchos.booking.modules.establishment_services.mapper.EstablishmentServicesMapper;
import com.sigchos.booking.modules.establishment_services.model.EstablishmentServices;
import com.sigchos.booking.modules.establishment_services.repository.EstablishmentServicesRepository;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.user.model.User;

import lombok.AllArgsConstructor;

@Service
@Transactional(readOnly = true)
@AllArgsConstructor
public class EstablishmentServicesService {
    private final EstablishmentServicesRepository repository;
    private final EstablishmentRepository establishmentRepository;

    private String normalizeName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }

    private String normalizeDescription(String description) {
        return description.trim().replaceAll("\\s+", " ");
    }

    private BigDecimal normalizeAdditionalCost(BigDecimal additionalCost) {
        return additionalCost == null ? BigDecimal.ZERO : additionalCost;
    }

    private boolean normalizeHasAdditionalCost(Boolean hasAdditionalCost) {
        return Boolean.TRUE.equals(hasAdditionalCost);
    }

    private BigDecimal resolveAdditionalCost(boolean hasAdditionalCost, BigDecimal additionalCost) {
        if (!hasAdditionalCost) {
            return BigDecimal.ZERO;
        }

        BigDecimal normalizedAdditionalCost = normalizeAdditionalCost(additionalCost);
        if (normalizedAdditionalCost.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "additionalCost must be greater than zero when hasAdditionalCost is true");
        }

        return normalizedAdditionalCost;
    }

    private Establishment findActiveEstablishment(Long establishmentId) {
        Establishment establishment = establishmentRepository.findById(establishmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Establishment not found (id: " + establishmentId + ")"));

        if (!establishment.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Establishment is inactive (id: " + establishmentId + ")");
        }

        return establishment;
    }

    private void validateAssociation(Long establishmentId, EstablishmentServicesRequest dto) {
        if (!establishmentId.equals(dto.establishmentId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Path establishmentId does not match request establishmentId");
        }
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
                "You are not allowed to manage services for this establishment");
    }

    public List<EstablishmentServicesResponse> findAllByEstablishment(Long establishmentId) {
        findActiveEstablishment(establishmentId);

        List<EstablishmentServices> entities = repository.findAllByEstablishmentId(establishmentId);
        return entities.stream().map(EstablishmentServicesMapper::toResponse).toList();
    }

    public List<EstablishmentServicesResponse> findAllPublicByEstablishment(Long establishmentId) {
        establishmentRepository.findByIdAndIsActiveTrue(establishmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Establishment not found (id: " + establishmentId + ")"));

        List<EstablishmentServices> entities = repository.findAllByEstablishmentIdAndIsActiveTrue(establishmentId);
        return entities.stream().map(EstablishmentServicesMapper::toResponse).toList();
    }

    public EstablishmentServicesResponse findById(Long establishmentId, Long id) {
        findActiveEstablishment(establishmentId);

        EstablishmentServices entity = repository.findByIdAndEstablishmentId(id, establishmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Service not found (id: " + id + ") for establishment (id: " + establishmentId + ")"));

        return EstablishmentServicesMapper.toResponse(entity);
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public EstablishmentServicesResponse create(User actor, Long establishmentId, EstablishmentServicesRequest dto) {
        validateAssociation(establishmentId, dto);
        Establishment establishment = findActiveEstablishment(establishmentId);
        ensureActorCanManageEstablishment(actor, establishment);

        String normalizedName = normalizeName(dto.name());
        if (repository.existsByEstablishmentIdAndNameIgnoreCase(establishmentId, normalizedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Service name already exists in establishment (name: " + normalizedName + ")");
        }

        String normalizedDescription = normalizeDescription(dto.description());
        boolean normalizedHasAdditionalCost = normalizeHasAdditionalCost(dto.hasAdditionalCost());
        BigDecimal normalizedAdditionalCost = resolveAdditionalCost(normalizedHasAdditionalCost, dto.additionalCost());

        EstablishmentServices entity = EstablishmentServicesMapper.toEntity(dto, establishment);
        entity.setName(normalizedName);
        entity.setDescription(normalizedDescription);
        entity.setHasAdditionalCost(normalizedHasAdditionalCost);
        entity.setAdditionalCost(normalizedAdditionalCost);

        EstablishmentServices saved = repository.save(entity);
        return EstablishmentServicesMapper.toResponse(saved);
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public EstablishmentServicesResponse update(User actor, Long establishmentId, Long id,
            EstablishmentServicesRequest dto) {
        validateAssociation(establishmentId, dto);
        Establishment establishment = findActiveEstablishment(establishmentId);
        ensureActorCanManageEstablishment(actor, establishment);

        EstablishmentServices found = repository.findByIdAndEstablishmentId(id, establishmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Service not found (id: " + id + ") for establishment (id: " + establishmentId + ")"));

        String normalizedName = normalizeName(dto.name());
        if (repository.existsByEstablishmentIdAndNameIgnoreCaseAndIdNot(establishmentId, normalizedName, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Service name already exists in establishment (name: " + normalizedName + ")");
        }

        String normalizedDescription = normalizeDescription(dto.description());
        boolean normalizedHasAdditionalCost = normalizeHasAdditionalCost(dto.hasAdditionalCost());
        BigDecimal normalizedAdditionalCost = resolveAdditionalCost(normalizedHasAdditionalCost, dto.additionalCost());

        found.setEstablishment(establishment);
        found.setCategory(dto.category());
        found.setName(normalizedName);
        found.setDescription(normalizedDescription);
        found.setHasAdditionalCost(normalizedHasAdditionalCost);
        found.setAdditionalCost(normalizedAdditionalCost);

        return EstablishmentServicesMapper.toResponse(found);
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public void delete(User actor, Long establishmentId, Long id) {
        Establishment establishment = findActiveEstablishment(establishmentId);
        ensureActorCanManageEstablishment(actor, establishment);

        EstablishmentServices found = repository.findByIdAndEstablishmentId(id, establishmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Service not found (id: " + id + ") for establishment (id: " + establishmentId + ")"));

        if (!found.isActive()) {
            return;
        }

        found.setActive(false);
    }

    @Transactional
    @PreAuthorize("hasRole('ESTABLISHMENT_ADMIN')")
    public void restore(User actor, Long establishmentId, Long id) {
        Establishment establishment = findActiveEstablishment(establishmentId);
        ensureActorCanManageEstablishment(actor, establishment);

        EstablishmentServices found = repository.findByIdAndEstablishmentId(id, establishmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Service not found (id: " + id + ") for establishment (id: " + establishmentId + ")"));

        if (found.isActive()) {
            return;
        }

        found.setActive(true);
    }
}
