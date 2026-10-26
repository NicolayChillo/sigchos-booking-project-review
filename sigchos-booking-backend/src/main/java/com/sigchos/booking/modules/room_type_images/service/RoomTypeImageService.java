package com.sigchos.booking.modules.room_type_images.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.room_type_images.dto.RoomTypeImageRequest;
import com.sigchos.booking.modules.room_type_images.dto.RoomTypeImageResponse;
import com.sigchos.booking.modules.room_type_images.dto.RoomTypeImageUpdateRequest;
import com.sigchos.booking.modules.room_type_images.mapper.RoomTypeImageMapper;
import com.sigchos.booking.modules.room_type_images.models.RoomTypeImage;
import com.sigchos.booking.modules.room_type_images.repository.RoomTypeImageRepository;
import com.sigchos.booking.modules.room_types.models.RoomType;
import com.sigchos.booking.modules.storage.dto.SignedFileResponse;
import com.sigchos.booking.modules.storage.dto.UploadFileResponse;
import com.sigchos.booking.modules.storage.exceptions.StorageException;
import com.sigchos.booking.modules.storage.services.StorageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomTypeImageService {
    private final RoomTypeImageRepository repository;
    private final StorageService storageService;
    private final String bucketName = "establishments";
    private final int imageExpirationInSeconds = 60 * 60 * 24;

    private String generateFileName(RoomType roomType, MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String fileName = String.format("establishment_%s/room_type_%s/image_%s%s",
                roomType.getEstablishment().getId(),
                roomType.getId(),
                timestamp,
                extension);

        return fileName;
    }

    public List<RoomTypeImageResponse> findByRoomTypeId(Long roomTypeId) {
        List<RoomTypeImage> entities = repository.findByRoomType_Id(roomTypeId);

        return entities.stream().map(img -> {
            SignedFileResponse signedFile = storageService.getSignedFileUrl(bucketName, img.getUrl(),
                    imageExpirationInSeconds);

            return RoomTypeImageMapper.toResponse(img, signedFile.signedUrl());
        }).toList();
    }

    public RoomTypeImageResponse findById(Long id) {
        RoomTypeImage entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "RoomType image not found (id: " + id + ")"));

        SignedFileResponse signedFile = storageService.getSignedFileUrl(bucketName, entity.getUrl(),
                imageExpirationInSeconds);

        return RoomTypeImageMapper.toResponse(entity, signedFile.signedUrl());
    }

    public String getSignedUrl(RoomTypeImage entity) {
        return storageService.getSignedFileUrl(bucketName, entity.getUrl(), imageExpirationInSeconds).signedUrl();
    }

    public RoomTypeImage createEntity(RoomType roomType, RoomTypeImageRequest dto) {
        String fileName = generateFileName(roomType, dto.file());

        try {
            UploadFileResponse uploadedFile = storageService.uploadFile(bucketName, fileName, dto.file());

            RoomTypeImage entity = RoomTypeImage.builder()
                    .isPrimary(dto.isPrimary())
                    .roomType(roomType)
                    .url(uploadedFile.fileName())
                    .build();

            return entity;
        } catch (StorageException e) {
            storageService.deleteFile(bucketName, fileName);

            throw e;
        }
    }

    @Transactional
    public RoomTypeImageResponse create(RoomType roomType, RoomTypeImageRequest dto) {
        RoomTypeImage entity = createEntity(roomType, dto);

        RoomTypeImage saved = repository.save(entity);

        String signedUrl = getSignedUrl(saved);

        return RoomTypeImageMapper.toResponse(saved, signedUrl);
    }

    public void updateEntity(RoomTypeImage entity, RoomTypeImageUpdateRequest dto) {
        entity.setPrimary(dto.isPrimary());

        if (dto.file() != null && !dto.file().isEmpty()) {
            String newFileName = generateFileName(entity.getRoomType(), dto.file());
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
