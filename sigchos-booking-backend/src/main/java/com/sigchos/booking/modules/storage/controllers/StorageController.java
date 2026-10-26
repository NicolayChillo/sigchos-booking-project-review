package com.sigchos.booking.modules.storage.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.sigchos.booking.modules.storage.dto.SignedFileResponse;
import com.sigchos.booking.modules.storage.dto.UploadFileResponse;
import com.sigchos.booking.modules.storage.services.StorageService;

import lombok.AllArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/storage")
@AllArgsConstructor
public class StorageController {
    private final StorageService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadFileResponse uploadFile(@RequestParam(required = true) MultipartFile file) {
        return service.uploadFile("payments", file.getOriginalFilename(), file);
    }

    @GetMapping("{fileName}")
    public SignedFileResponse getSignedFile(@RequestParam String fileName) {
        return service.getSignedFileUrl("payments", fileName, 60);
    }

}
