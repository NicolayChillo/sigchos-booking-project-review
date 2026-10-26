package com.sigchos.booking.modules.notifications.service;

import com.sigchos.booking.modules.bookings.model.Booking;
import com.sigchos.booking.modules.user.model.User;

public interface EmailNotificationService {

    void sendBookingCreatedToClient(Booking booking);

    void sendBookingCreatedToEstablishmentAdmin(Booking booking);

    void sendPasswordRecovery(User user, String resetUrl, long expirationMinutes);

    void sendMembershipRequestReviewed(
            String recipientEmail,
            String firstName,
            String lastName,
            boolean approved,
            String actionUrl,
            String tempPassword,
            String note);

    void sendPaymentValidationToClient(
            String recipientEmail,
            String firstName,
            String lastName,
            boolean approved,
            String bookingReference,
            String bookingDates,
            String amount,
            String note);

    void sendEstablishmentRequestReviewed(
            String recipientEmail,
            String firstName,
            String lastName,
            boolean approved,
            String establishmentName,
            String establishmentAddress,
            String actionUrl,
            String note);
}
