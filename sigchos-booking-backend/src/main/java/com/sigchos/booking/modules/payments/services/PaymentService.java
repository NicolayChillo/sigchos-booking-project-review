package com.sigchos.booking.modules.payments.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.bookings.enums.BookingStatus;
import com.sigchos.booking.modules.bookings.model.Booking;
import com.sigchos.booking.modules.bookings.service.BookingService;
import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.payments.dto.BankTransferPaymentRequest;
import com.sigchos.booking.modules.payments.dto.BankTransferPaymentValidationRequest;
import com.sigchos.booking.modules.payments.dto.PaymentCheckoutResponse;
import com.sigchos.booking.modules.payments.dto.PaymentResponse;
import com.sigchos.booking.modules.payments.dto.VerifyPaymentRequest;
import com.sigchos.booking.modules.payments.enums.PaymentMethod;
import com.sigchos.booking.modules.payments.enums.PaymentStatus;
import com.sigchos.booking.modules.payments.enums.PaymentStatusFilter;
import com.sigchos.booking.modules.payments.mappers.PaymentMapper;
import com.sigchos.booking.modules.payments.models.Payment;
import com.sigchos.booking.modules.payments.repositories.PaymentRepository;
import com.sigchos.booking.modules.payphone.dto.VerifyPayphonePaymentRequest;
import com.sigchos.booking.modules.payphone.dto.VerifyPayphonePaymentResponse;
import com.sigchos.booking.modules.payphone.service.PayphoneService;
import com.sigchos.booking.modules.storage.dto.SignedFileResponse;
import com.sigchos.booking.modules.storage.dto.UploadFileResponse;
import com.sigchos.booking.modules.storage.exceptions.StorageException;
import com.sigchos.booking.modules.storage.services.StorageService;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.modules.notifications.service.EmailNotificationService;

import lombok.AllArgsConstructor;

@Service
@Transactional(readOnly = true)
@AllArgsConstructor
public class PaymentService {
    private final PaymentRepository repository;
    private final BookingService bookingService;
    private final StorageService storageService;
    private final EmailNotificationService emailNotificationService;
    private final String bucketName = "payments";
    private final PayphoneService payphoneService;

    private String getSignedUrl(String fileName) {
        int expiresInSeconds = 60 * 60;
        SignedFileResponse signedResponse = storageService.getSignedFileUrl(bucketName, fileName,
                expiresInSeconds);
        return signedResponse.signedUrl();
    }

    private void updateBookingStatusAfterApproval(Payment payment) {

        Booking booking = payment.getBooking();

        List<Payment> approvedPayments = repository.findByBooking_Id(booking.getId())
                .stream()
                .filter(p -> p.getStatus() == PaymentStatus.APPROVED &&
                        !p.getId().equals(payment.getId()))
                .toList();

        BigDecimal totalPaid = approvedPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(payment.getAmount());

        if (totalPaid.compareTo(booking.getTotalAmount()) >= 0) {

            booking.setStatus(BookingStatus.COMPLETED);

            return;
        }

        boolean requiresAdvancePayment = booking.getRoomUnit()
                .getType()
                .getRequiresAdvancePayment();

        if (requiresAdvancePayment) {
            booking.setStatus(BookingStatus.ADVANCE_CONFIRMED);
        }
    }

    @PreAuthorize("hasAnyRole('ESTABLISHMENT_ADMIN', 'CLIENT')")
    public List<PaymentResponse> findByBookingId(Long bookingId, PaymentStatusFilter filter) {
        List<Payment> payments = filter.toPaymentStatus()
                .map(status -> repository.findByBooking_IdAndStatus(bookingId, status))
                .orElseGet(() -> repository.findByBooking_Id(bookingId));

        return payments.stream().map(p -> {
            boolean hasReceipt = p.getReceiptUrl() != null;

            PaymentResponse response = null;

            if (hasReceipt) {
                response = PaymentMapper.toResponse(p, getSignedUrl(p.getReceiptUrl()));
            } else {
                response = PaymentMapper.toResponse(p);
            }

            return response;
        }).toList();
    }

    @Transactional
    @PreAuthorize("hasAnyRole('CLIENT')")
    public PaymentResponse uploadBankTransferReceipt(Long bookingId, BankTransferPaymentRequest dto) {
        String originalFileName = dto.receiptFile().getOriginalFilename();

        String extension = originalFileName.substring(originalFileName.lastIndexOf('.'));

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));

        String fileName = String.format(
                "booking_%s/receipt_%s%s",
                bookingId,
                timestamp,
                extension);

        try {
            Booking booking = bookingService.findEntityById(bookingId);

            List<Payment> previousPayments = repository.findByBooking_Id(booking.getId());

            if (booking.getStatus() == BookingStatus.COMPLETED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Reservation payment completed");
            }

            if (booking.getStatus() == BookingStatus.CANCELED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Reservation is cancelled");
            }

            boolean hasPendingPaymentToVerify = previousPayments.stream()
                    .anyMatch(p -> p.getStatus() == PaymentStatus.PENDING);

            if (hasPendingPaymentToVerify) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Pending payments awaiting approval");
            }

            UploadFileResponse uploadedFile = storageService.uploadFile(
                    bucketName,
                    fileName,
                    dto.receiptFile());

            List<Payment> previousApprovedPayments = previousPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.APPROVED).toList();

            boolean isFirstPayment = previousApprovedPayments.size() == 0;

            Payment entity = PaymentMapper.toEntity(dto, booking, uploadedFile.fileName());

            if (isFirstPayment) {
                boolean isAdvancePaymentRequired = booking.getRoomUnit().getType().getRequiresAdvancePayment();
                entity.setAmount(
                        isAdvancePaymentRequired ? booking.getAdvancePaymentAmount() : booking.getTotalAmount());
            } else {
                BigDecimal totalAmountPaid = previousApprovedPayments.stream().map(Payment::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal outstandingPayment = booking.getTotalAmount().subtract(totalAmountPaid);
                entity.setAmount(outstandingPayment);
            }

            Payment saved = repository.save(entity);

            return PaymentMapper.toResponse(saved, getSignedUrl(saved.getReceiptUrl()));
        } catch (StorageException e) {
            throw e;
        } catch (Exception e) {
            storageService.deleteFile(bucketName, fileName);
            throw e;
        }
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ESTABLISHMENT_ADMIN')")
    public PaymentResponse validateBankTransferReceipt(User user, Long id, BankTransferPaymentValidationRequest dto) {
        Payment payment = repository.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found (id: " + id + ")"));

        User establishmentOwner = payment.getBooking().getEstablishment().getUser();
        if (!establishmentOwner.getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Insufficient permissions to validate this payment");
        }

        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Payment cannot be processed or has already been processed");
        }

        if (dto.status() == PaymentStatus.REJECTED) {
            if (dto.rejectionReason() == null || dto.rejectionReason().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason is required");
            }
            payment.setRejectionReason(dto.rejectionReason());
        }

        payment.setStatus(dto.status());
        payment.setVerifiedAt(LocalDateTime.now());

        if (dto.status() == PaymentStatus.APPROVED) {
            payment.setRejectionReason(null);
            Booking booking = payment.getBooking();

            List<Payment> previousPayments = repository.findByBooking_IdAndIdNot(booking.getId(), payment.getId());
            List<Payment> previousApprovedPayments = previousPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.APPROVED).toList();

            BigDecimal totalAmountPaid = previousApprovedPayments.stream().map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal currentPaymentAmount = payment.getAmount();

            BigDecimal totalPaymentAmount = totalAmountPaid.add(currentPaymentAmount);

            if (totalPaymentAmount.compareTo(booking.getTotalAmount()) == 0) {
                booking.setStatus(BookingStatus.COMPLETED);
            } else {
                booking.setStatus(BookingStatus.ADVANCE_CONFIRMED);
            }
        }

        repository.save(payment);

        try {
            Booking booking = payment.getBooking();
            User bookingUser = booking.getUser();
            String clientEmail = bookingUser == null ? null : bookingUser.getEmail();
            if (clientEmail != null && !clientEmail.isBlank()) {
                String bookingRef = "#" + booking.getId();
                String bookingDates = booking.getCheckInDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        + " - " + booking.getCheckOutDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                String amount = "$" + payment.getAmount();
                emailNotificationService.sendPaymentValidationToClient(
                        clientEmail,
                        bookingUser.getFirstName(),
                        bookingUser.getLastName(),
                        payment.getStatus() == PaymentStatus.APPROVED,
                        bookingRef,
                        bookingDates,
                        amount,
                        payment.getRejectionReason());
            }
        } catch (Exception ex) {

        }

        return PaymentMapper.toResponse(payment, getSignedUrl(payment.getReceiptUrl()));
    }

    @Transactional
    public PaymentCheckoutResponse createPaymentCheckout(Long bookingId) {
        Booking booking = bookingService.findEntityById(bookingId);

        Establishment establishment = booking.getEstablishment();

        if (!establishment.hasGatewayAvailable()) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_CONTENT,
                    "The establishment is not configured to process gateway payments.");
        }

        List<Payment> payments = repository.findByBooking_Id(booking.getId());

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Reservation payment completed");
        }

        if (booking.getStatus() == BookingStatus.CANCELED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Reservation is cancelled");
        }

        boolean hasPendingManualPayment = payments.stream()
                .anyMatch(payment -> payment.getMethod() == PaymentMethod.BANK_TRANSFER &&
                        payment.getStatus() == PaymentStatus.PENDING);

        if (hasPendingManualPayment) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pending payments awaiting approval");
        }

        LocalDateTime expirationLimit = LocalDateTime.now().minusMinutes(5);

        payments.stream()
                .filter(payment -> payment.getMethod() == PaymentMethod.GATEWAY &&
                        payment.getStatus() == PaymentStatus.CREATED &&
                        payment.getCreatedAt().isBefore(expirationLimit))
                .forEach(payment -> payment.setStatus(PaymentStatus.CANCELLED));

        Optional<Payment> activeCheckout = payments.stream()
                .filter(payment -> payment.getMethod() == PaymentMethod.GATEWAY &&
                        payment.getStatus() == PaymentStatus.CREATED)
                .findFirst();

        String payphoneToken = establishment.getPayphoneToken();
        String payphoneStoreId = establishment.getPayphoneStoreId();

        if (activeCheckout.isPresent()) {

            Payment payment = activeCheckout.get();

            return new PaymentCheckoutResponse(
                    payphoneToken,
                    payment.getTransactionReference(),
                    PayphoneService.formatMoney(payment.getAmount()),
                    PayphoneService.formatMoney(payment.getAmount()),
                    "USD",
                    payphoneStoreId,
                    "Pago de reserva #" + payment.getId());
        }

        List<Payment> approvedPayments = payments.stream()
                .filter(payment -> payment.getStatus() == PaymentStatus.APPROVED)
                .toList();

        BigDecimal amount;

        if (approvedPayments.isEmpty()) {

            boolean requiresAdvancePayment = booking.getRoomUnit()
                    .getType()
                    .getRequiresAdvancePayment();

            amount = requiresAdvancePayment
                    ? booking.getAdvancePaymentAmount()
                    : booking.getTotalAmount();

        } else {

            BigDecimal totalPaid = approvedPayments.stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            amount = booking.getTotalAmount()
                    .subtract(totalPaid);
        }

        String transactionId = "OTA-" + UUID.randomUUID()
                .toString()
                .substring(0, 8)
                .toUpperCase();

        Payment payment = Payment.builder()
                .booking(booking)
                .method(PaymentMethod.GATEWAY)
                .status(PaymentStatus.CREATED)
                .transactionReference(transactionId)
                .amount(amount)
                .build();

        Payment saved = repository.save(payment);

        return new PaymentCheckoutResponse(
                payphoneToken,
                saved.getTransactionReference(),
                PayphoneService.formatMoney(saved.getAmount()),
                PayphoneService.formatMoney(saved.getAmount()),
                "USD",
                payphoneStoreId,
                "Pago de reserva #" + saved.getId());
    }

    @Transactional
    public PaymentResponse processPaymentCheckout(VerifyPaymentRequest dto) {
        Payment payment = repository.findByTransactionReferenceForUpdate(dto.clientTransactionId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Payment reference not found"));

        Establishment establishment = payment.getBooking().getEstablishment();

        if (!establishment.hasGatewayAvailable()) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_CONTENT,
                    "The establishment is not configured to process gateway payments.");
        }

        if (payment.getStatus() == PaymentStatus.APPROVED
                || payment.getStatus() == PaymentStatus.REJECTED
                || payment.getStatus() == PaymentStatus.CANCELLED) {
            return PaymentMapper.toResponse(payment);
        }

        if (payment.getStatus() == PaymentStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Payment is already being processed");
        }

        payment.setStatus(PaymentStatus.PENDING);

        VerifyPayphonePaymentRequest payphonePaymentRequest = new VerifyPayphonePaymentRequest(dto.transactionId(),
                dto.clientTransactionId());

        VerifyPayphonePaymentResponse verificationResponse = payphoneService
                .verifyPayment(establishment.getPayphoneToken(), payphonePaymentRequest);

        if (!payment.getTransactionReference().trim()
                .equalsIgnoreCase(verificationResponse.clientTransactionId().trim())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Transaction reference mismatch");
        }

        Long expectedAmount = PayphoneService.formatMoney(payment.getAmount());

        if (!expectedAmount.equals(verificationResponse.amount())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    String.format(
                            "Amount mismatch. Expected: %s, Received: %s",
                            expectedAmount,
                            verificationResponse.amount()));
        }

        payment.setVerifiedAt(LocalDateTime.now());

        String transactionStatus = verificationResponse.transactionStatus();

        switch (transactionStatus.toUpperCase()) {

            case "APPROVED":

                payment.setStatus(PaymentStatus.APPROVED);

                updateBookingStatusAfterApproval(payment);

                break;

            case "DECLINED":

                payment.setStatus(PaymentStatus.REJECTED);

                break;

            default:
                payment.setStatus(PaymentStatus.CANCELLED);
        }

        return PaymentMapper.toResponse(payment);
    }
}
