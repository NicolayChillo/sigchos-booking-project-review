package com.sigchos.booking.modules.storage.services;

import java.io.IOException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import com.sigchos.booking.modules.storage.dto.SignedFileClientResponse;
import com.sigchos.booking.modules.storage.dto.SignedFileResponse;
import com.sigchos.booking.modules.storage.dto.UploadFileResponse;
import com.sigchos.booking.modules.storage.exceptions.StorageException;
import com.sigchos.booking.modules.storage.exceptions.StorageFileDuplicatedException;
import com.sigchos.booking.modules.storage.exceptions.StorageFileInvalidException;
import com.sigchos.booking.modules.storage.exceptions.StorageFileNotFoundException;

@Service
public class StorageService {
    private final RestClient restClient = RestClient.create();

    @Value("${app.supabase.url}")
    String projectUrl;

    @Value("${app.supabase.key}")
    String apikey;

    public UploadFileResponse uploadFile(String bucketName, String fileName, MultipartFile file) {
        try {
            String url = String.format("%s/storage/v1/object/%s/%s", projectUrl, bucketName, fileName);

            restClient.post().uri(url)
                    .header("apiKey", apikey)
                    .header("Authorization", "Bearer " + apikey)
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .body(file.getBytes())
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new StorageFileDuplicatedException(
                                "Filename already exists");
                    })
                    .toBodilessEntity();

            return new UploadFileResponse(
                    fileName);
        } catch (IOException exception) {
            throw new StorageFileInvalidException("Invalid filename");
        }
    }

    public SignedFileResponse getSignedFileUrl(String bucketName, String fileName, int expiresInSeconds) {
        String url = String.format("%s/storage/v1/object/sign/%s/%s", projectUrl, bucketName, fileName);

        Map<String, Integer> body = Map.of("expiresIn", expiresInSeconds);

        SignedFileClientResponse response = restClient.post().uri(url)
                .header("apiKey", apikey)
                .header("Authorization", "Bearer " + apikey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw new StorageFileNotFoundException(
                            "Filename not found or dont have enough permissions");
                })
                .body(SignedFileClientResponse.class);

        return new SignedFileResponse(projectUrl + "/storage/v1" + response.signedUrl());
    }

    public UploadFileResponse replaceFile(String bucketName, String fileName, MultipartFile file) {
        try {
            String url = String.format("%s/storage/v1/object/%s/%s", projectUrl, bucketName, fileName);

            restClient.put().uri(url)
                    .header("apiKey", apikey)
                    .header("Authorization", "Bearer " + apikey)
                    .header("x-upsert", "true")
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .body(file.getBytes())
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new StorageException("Storage error: Unable to upload or replace file.");
                    })
                    .toBodilessEntity();

            return new UploadFileResponse(fileName);
        } catch (IOException exception) {
            throw new StorageFileInvalidException("Invalid filename or file data");
        }
    }

    public void deleteFile(String bucketName, String fileName) {
        String url = String.format("%s/storage/v1/object/%s/%s", projectUrl, bucketName, fileName);

        restClient.delete().uri(url)
                .header("apiKey", apikey)
                .header("Authorization", "Bearer " + apikey)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw new StorageFileNotFoundException(
                            "Filename not found");
                })
                .toBodilessEntity();
    }
}
