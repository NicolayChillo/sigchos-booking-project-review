package com.sigchos.booking.modules.payphone.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.payphone.dto.VerifyPayphonePaymentRequest;
import com.sigchos.booking.modules.payphone.dto.VerifyPayphonePaymentResponse;

import lombok.Getter;

@Service
@Getter
public class PayphoneService {
    private static final String baseUrl = "https://paymentbox.payphonetodoesposible.com/api";

    private RestClient restClient;

    public PayphoneService() {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    public static Long formatMoney(BigDecimal amount) {
        if (amount == null) {
            return 0L;
        }

        return amount.multiply(new BigDecimal("100"))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();
    }

    public VerifyPayphonePaymentResponse verifyPayment(String payphoneToken, VerifyPayphonePaymentRequest dto) {
        try {
            return restClient
                    .post()
                    .uri("/confirm")
                    .header("Authorization", "Bearer " + payphoneToken)
                    .body(dto)
                    .retrieve()
                    .body(VerifyPayphonePaymentResponse.class);

        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "PayPhone error: " + ex.getResponseBodyAsString(),
                    ex);
        }
    }
}