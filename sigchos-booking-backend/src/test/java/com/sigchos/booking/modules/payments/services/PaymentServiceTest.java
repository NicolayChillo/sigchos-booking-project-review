package com.sigchos.booking.modules.payments.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.bookings.enums.BookingStatus;
import com.sigchos.booking.modules.bookings.model.Booking;
import com.sigchos.booking.modules.bookings.service.BookingService;
import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.notifications.service.EmailNotificationService;
import com.sigchos.booking.modules.payments.dto.PaymentResponse;
import com.sigchos.booking.modules.payments.enums.PaymentMethod;
import com.sigchos.booking.modules.room_types.models.RoomType;
import com.sigchos.booking.modules.room_units.model.RoomUnit;
import com.sigchos.booking.modules.payments.enums.PaymentStatus;
import com.sigchos.booking.modules.payments.enums.PaymentStatusFilter;
import com.sigchos.booking.modules.payments.models.Payment;
import com.sigchos.booking.modules.payments.repositories.PaymentRepository;
import com.sigchos.booking.modules.payphone.service.PayphoneService;
import com.sigchos.booking.modules.storage.dto.SignedFileResponse;
import com.sigchos.booking.modules.storage.dto.UploadFileResponse;
import com.sigchos.booking.modules.storage.services.StorageService;
import org.springframework.mock.web.MockMultipartFile;
import com.sigchos.booking.modules.payments.dto.BankTransferPaymentRequest;
import com.sigchos.booking.modules.payments.dto.BankTransferPaymentValidationRequest;
import com.sigchos.booking.modules.payments.dto.VerifyPaymentRequest;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.modules.payphone.dto.VerifyPayphonePaymentResponse;
import com.sigchos.booking.modules.payphone.dto.VerifyPayphonePaymentRequest;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingService bookingService;

    @Mock
    private StorageService storageService;

    @Mock
    private EmailNotificationService emailNotificationService;

    @Mock
    private PayphoneService payphoneService;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository,
                bookingService,
                storageService,
                emailNotificationService,
                payphoneService);
    }

    @Test
    void findByBookingId_ShouldReturnPayments() {
        Booking booking = new Booking();
        booking.setId(1L);
        Payment payment = new Payment();
        payment.setId(1L);
        payment.setAmount(new BigDecimal("100.00"));
        payment.setStatus(PaymentStatus.APPROVED);
        payment.setMethod(PaymentMethod.BANK_TRANSFER);
        payment.setReceiptUrl("some-receipt.png");
        payment.setBooking(booking);

        when(paymentRepository.findByBooking_Id(1L)).thenReturn(List.of(payment));
        when(storageService.getSignedFileUrl(eq("payments"), eq("some-receipt.png"), anyInt()))
                .thenReturn(new SignedFileResponse("https://signed.url"));

        List<PaymentResponse> responses = paymentService.findByBookingId(1L, PaymentStatusFilter.ALL);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("https://signed.url", responses.get(0).receiptUrl());
    }

    @Test
    void createPaymentCheckout_ShouldThrowException_WhenGatewayNotAvailable() {
        Booking booking = new Booking();
        booking.setId(1L);
        Establishment establishment = new Establishment();
        establishment.setPayphoneStoreId("");
        booking.setEstablishment(establishment);

        when(bookingService.findEntityById(1L)).thenReturn(booking);

        assertThrows(ResponseStatusException.class, () -> paymentService.createPaymentCheckout(1L));
    }

    @Test
    void uploadBankTransferReceipt_ShouldSavePayment() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setAdvancePaymentAmount(new BigDecimal("50.00"));
        booking.setStatus(BookingStatus.PENDING);
        RoomType rt = new RoomType();
        rt.setRequiresAdvancePayment(true);
        RoomUnit ru = new RoomUnit();
        ru.setType(rt);
        booking.setRoomUnit(ru);
        
        when(bookingService.findEntityById(1L)).thenReturn(booking);
        when(storageService.uploadFile(eq("payments"), anyString(), any())).thenReturn(new UploadFileResponse("receipt.png"));
        
        Payment payment = new Payment();
        payment.setId(2L);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setAmount(new BigDecimal("50.00"));
        payment.setBooking(booking);
        
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
        when(storageService.getSignedFileUrl(any(), any(), anyInt())).thenReturn(new SignedFileResponse("url"));

        BankTransferPaymentRequest req = new BankTransferPaymentRequest(new MockMultipartFile("file", "receipt.png", "image/png", new byte[0]));
        PaymentResponse res = paymentService.uploadBankTransferReceipt(1L, req);
        
        assertNotNull(res);
        assertEquals(PaymentStatus.PENDING, res.status());
    }

    @Test
    void validateBankTransferReceipt_ShouldApprovePayment() {
        User user = new User();
        user.setId(1L);
        
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setTotalAmount(new BigDecimal("100.00"));
        Establishment est = new Establishment();
        est.setUser(user);
        booking.setEstablishment(est);

        Payment payment = new Payment();
        payment.setId(1L);
        payment.setAmount(new BigDecimal("100.00"));
        payment.setBooking(booking);
        
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));
        when(storageService.getSignedFileUrl(any(), any(), anyInt())).thenReturn(new SignedFileResponse("url"));
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);

        BankTransferPaymentValidationRequest req = new BankTransferPaymentValidationRequest(PaymentStatus.APPROVED, null);
        PaymentResponse res = paymentService.validateBankTransferReceipt(user, 1L, req);
        
        assertNotNull(res);
    }

    @Test
    void processPaymentCheckout_ShouldApprovePayment() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setAdvancePaymentAmount(new BigDecimal("50.00"));
        
        Establishment est = new Establishment();
        est.setPayphoneToken("token");
        est.setPayphoneStoreId("store");
        booking.setEstablishment(est);

        Payment payment = new Payment();
        payment.setId(1L);
        payment.setBooking(booking);
        payment.setStatus(PaymentStatus.CREATED);
        payment.setAmount(new BigDecimal("50.00"));
        payment.setTransactionReference("client-tx");

        when(paymentRepository.findByTransactionReferenceForUpdate("client-tx")).thenReturn(Optional.of(payment));
        
        VerifyPayphonePaymentResponse payphoneRes = new VerifyPayphonePaymentResponse(
            null, null, null, null, null, null, null, null, 5000L, "client-tx", null, null, "Approved", null, null, null, null, null, null, null, null, null, null, null
        );
        lenient().when(payphoneService.verifyPayment(eq("token"), any(VerifyPayphonePaymentRequest.class))).thenReturn(payphoneRes);
        
        lenient().when(paymentRepository.save(any(Payment.class))).thenReturn(payment);

        VerifyPaymentRequest req = new VerifyPaymentRequest(1L, "client-tx");
        PaymentResponse res = paymentService.processPaymentCheckout(req);
        
        assertNotNull(res);
    }
}
