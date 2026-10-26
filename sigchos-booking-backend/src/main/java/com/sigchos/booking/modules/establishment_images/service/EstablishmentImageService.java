package com.sigchos.booking.modules.establishment_images.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.establishment_images.dto.EstablishmentImageRequest;
import com.sigchos.booking.modules.establishment_images.dto.EstablishmentImageResponse;
import com.sigchos.booking.modules.establishment_images.dto.EstablishmentImageUpdateRequest;
import com.sigchos.booking.modules.establishment_images.mapper.EstablishmentImageMapper;
import com.sigchos.booking.modules.establishment_images.model.EstablishmentImage;
import com.sigchos.booking.modules.establishment_images.repository.EstablishmentImageRepository;
import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.storage.dto.SignedFileResponse;
import com.sigchos.booking.modules.storage.dto.UploadFileResponse;
import com.sigchos.booking.modules.storage.exceptions.StorageException;
import com.sigchos.booking.modules.storage.services.StorageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EstablishmentImageService {
    private final EstablishmentImageRepository repository;
    private final StorageService storageService;
    private final String bucketName = "establishments";
    private final int imageExpirationInSeconds = 60 * 60 * 24;

    private String generateFileName(Establishment establishment, MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String fileName = String.format("establishment_%s/image_%s%s",
                establishment.getId(),
                timestamp,
                extension);

        return fileName;
    }

    public List<EstablishmentImageResponse> findByEstablishmentId(Long establishmentId) {
        List<EstablishmentImage> entities = repository.findByEstablishment_Id(establishmentId);

        return entities.stream().map(img -> {
            SignedFileResponse signedFile = storageService.getSignedFileUrl(bucketName, img.getUrl(),
                    imageExpirationInSeconds);

            return EstablishmentImageMapper.toResponse(img, signedFile.signedUrl());
        }).toList();
    }

    public EstablishmentImageResponse findById(Long id) {
        EstablishmentImage entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Establishment image not found (id: " + id + ")"));

        SignedFileResponse signedFile = storageService.getSignedFileUrl(bucketName, entity.getUrl(),
                imageExpirationInSeconds);

        return EstablishmentImageMapper.toResponse(entity, signedFile.signedUrl());
    }

    public String getSignedUrl(EstablishmentImage entity) {
        return storageService.getSignedFileUrl(bucketName, entity.getUrl(), imageExpirationInSeconds).signedUrl();
    }

    public EstablishmentImage createEntity(Establishment establishment, EstablishmentImageRequest dto) {
        String fileName = generateFileName(establishment, dto.file());

        try {
            UploadFileResponse uploadedFile = storageService.uploadFile(bucketName, fileName, dto.file());

            EstablishmentImage entity = EstablishmentImage.builder()
                    .isPrimary(dto.isPrimary())
                    .establishment(establishment)
                    .url(uploadedFile.fileName())
                    .build();

            return entity;
        } catch (StorageException e) {
            storageService.deleteFile(bucketName, fileName);

            throw e;
        }
    }

    public void updateEntity(EstablishmentImage entity, EstablishmentImageUpdateRequest dto) {
        entity.setPrimary(dto.isPrimary());

        if (dto.file() != null && !dto.file().isEmpty()) {
            String newFileName = generateFileName(entity.getEstablishment(), dto.file());
            String previousFileName = entity.getUrl();
            boolean isUploaded = false;

            try {
                UploadFileResponse uploadFileResponse = storageService.uploadFile(bucketName, newFileName, dto.file());
                isUploaded = true;

                entity.setUrl(uploadFileResponse.fileName());

                if (previousFileName != null) {
                    storageService.deleteFile(bucketName, previousFileName);
                }
            } catch (StorageException e) {
                if (isUploaded) {
                    try {
                        storageService.deleteFile(bucketName, newFileName);
                    } catch (Exception ignored) {
                    }
                }
                throw e;
            }
        }
    }
}
