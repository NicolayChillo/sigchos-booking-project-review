package com.sigchos.booking.modules.establishment_requests.services;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.establishment_requests.dto.EstablishmentRequestCreate;
import com.sigchos.booking.modules.establishment_requests.dto.EstablishmentRequestResponse;
import com.sigchos.booking.modules.establishment_requests.dto.EstablishmentRequestReview;
import com.sigchos.booking.modules.establishment_requests.enums.EstablishmentRequestStatus;
import com.sigchos.booking.modules.establishment_requests.enums.EstablishmentRequestStatusFilter;
import com.sigchos.booking.modules.establishment_requests.mapper.EstablishmentRequestMapper;
import com.sigchos.booking.modules.establishment_requests.model.EstablishmentRequest;
import com.sigchos.booking.modules.establishment_requests.repository.EstablishmentRequestRepository;
import com.sigchos.booking.modules.establishments.service.EstablishmentService;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.storage.dto.UploadFileResponse;
import com.sigchos.booking.modules.storage.exceptions.StorageException;
import com.sigchos.booking.modules.storage.services.StorageService;
import com.sigchos.booking.modules.notifications.service.EmailNotificationService;
import com.sigchos.booking.modules.user.model.User;

import lombok.RequiredArgsConstructor;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class EstablishmentRequestService {
    private final EstablishmentRequestRepository repository;
    private final StorageService storageService;
    private final EstablishmentService establishmentService;
    private final EmailNotificationService emailNotificationService;
    private final String bucketName = "establishment_certificates";

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    private String normalizeText(String text) {
        return text == null ? null : text.trim().replaceAll("\\s+", " ");
    }

    private String getSignedUrl(String fileName) {
        return storageService.getSignedFileUrl(bucketName, fileName, 60 * 60).signedUrl();
    }

    public List<EstablishmentRequestResponse> findAll(User user,
            EstablishmentRequestStatusFilter filter) {
        List<EstablishmentRequest> entities = filter.toEstablishmentRequestStatus()
                .map(status -> {
                    if (user.getRole() == Role.SYSTEM_ADMIN)
                        return repository.findByStatus(status);
                    else
                        return repository.findByStatusAndRequestedBy_Id(status, user.getId());

                })
                .orElseGet(() -> {
                    if (user.getRole() == Role.SYSTEM_ADMIN)
                        return repository.findAll();
                    else
                        return repository.findByRequestedBy_Id(user.getId());
                });

        return entities.stream()
                .map((entity) -> EstablishmentRequestMapper.toResponse(entity,
                        getSignedUrl(entity.getCertificateUrl())))
                .toList();
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ESTABLISHMENT_ADMIN')")
    public EstablishmentRequestResponse create(User requester, EstablishmentRequestCreate dto) {
        List<EstablishmentRequest> previousRequests = repository.findByRequestedBy_Id(requester.getId());

        boolean hasPendingRequest = previousRequests.stream()
                .anyMatch(request -> request.getStatus() == EstablishmentRequestStatus.PENDING);

        if (hasPendingRequest)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Pending request awaiting review");

        String normalizedName = normalizeText(dto.name());
        String normalizedAddress = normalizeText(dto.address());

        if (establishmentService.isEstablishmentNameTakenByUser(normalizedName, requester.getId()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Establishment name (" + normalizedName + ") already exists for current user");

        MultipartFile certificateFile = dto.certificateFile();

        String originalFileName = certificateFile.getOriginalFilename();

        String extension = originalFileName.substring(originalFileName.lastIndexOf('.'));

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));

        String fileName = String.format(
                "requester_%s/certificate_%s%s",
                requester.getId(),
                timestamp,
                extension);

        try {
            UploadFileResponse uploadedFile = storageService.uploadFile(
                    bucketName,
                    fileName,
                    certificateFile);

            EstablishmentRequest entity = EstablishmentRequest.builder()
                    .requestedBy(requester)
                    .name(normalizedName)
                    .address(normalizedAddress)
                    .certificateUrl(uploadedFile.fileName())
                    .build();

            EstablishmentRequest saved = repository.save(entity);

            return EstablishmentRequestMapper.toResponse(saved, getSignedUrl(saved.getCertificateUrl()));
        } catch (StorageException e) {
            throw e;
        } catch (Exception e) {
            storageService.deleteFile(bucketName, fileName);
            throw e;
        }
    }

    @Transactional
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN')")
    public EstablishmentRequestResponse review(User reviewer, Long id, EstablishmentRequestReview dto) {
        boolean hasReviewNote = dto.reviewNote() != null;

        if (dto.status() == EstablishmentRequestStatus.REJECTED && !hasReviewNote)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review note is required");

        String normalizedReviewNote = normalizeText(dto.reviewNote());

        EstablishmentRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Establishment request not found (id: " + id + ")"));

        boolean isReviewed = entity.getStatus() != EstablishmentRequestStatus.PENDING;

        if (isReviewed)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request has been already reviewed");

        entity.setStatus(dto.status());
        entity.setReviewedBy(reviewer);
        entity.setReviewNote(normalizedReviewNote);
        entity.setReviewedAt(LocalDateTime.now());

        if (dto.status() == EstablishmentRequestStatus.APPROVED) {
            establishmentService.create(entity.getRequestedBy(),
                    EstablishmentRequestMapper.toEstablishmentRequest(entity));
        }

        EstablishmentRequest saved = repository.save(entity);

        try {
            if (saved.getRequestedBy() != null && saved.getRequestedBy().getEmail() != null) {
                String actionUrl = frontendBaseUrl.endsWith("/")
                        ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1) + "/establishments"
                        : frontendBaseUrl + "/establishments";

                emailNotificationService.sendEstablishmentRequestReviewed(
                        saved.getRequestedBy().getEmail(),
                        saved.getRequestedBy().getFirstName(),
                        saved.getRequestedBy().getLastName(),
                        saved.getStatus() == EstablishmentRequestStatus.APPROVED,
                        saved.getName(),
                        saved.getAddress(),
                        actionUrl,
                        saved.getReviewNote());
            }
        } catch (Exception ex) {
            // no bloquear el flujo por fallas en notificacion
        }

        return EstablishmentRequestMapper.toResponse(saved, getSignedUrl(saved.getCertificateUrl()));
    }
}
