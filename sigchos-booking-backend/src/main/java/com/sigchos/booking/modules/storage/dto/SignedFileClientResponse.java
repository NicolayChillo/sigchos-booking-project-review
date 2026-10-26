package com.sigchos.booking.modules.storage.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record SignedFileClientResponse(@JsonProperty("signedURL") String signedUrl) {

}
