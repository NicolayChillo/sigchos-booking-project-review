package com.sigchos.booking.modules.notifications.service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.sigchos.booking.modules.bookings.model.Booking;
import com.sigchos.booking.modules.notifications.config.BrevoProperties;
import com.sigchos.booking.modules.user.model.User;

import jakarta.mail.internet.MimeMessage;

@Service
public class BrevoNotificationService implements EmailNotificationService {
    private static final Logger LOGGER = LoggerFactory.getLogger(BrevoNotificationService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String TEMPLATE_BOOKING_CLIENT = "mail/booking-client";
    private static final String TEMPLATE_BOOKING_ADMIN = "mail/booking-admin";
    private static final String TEMPLATE_PASSWORD_RECOVERY = "mail/password-recovery";
    private static final String TEMPLATE_MEMBERSHIP_REQUEST_REVIEW = "mail/membership-request-review";
    private static final String TEMPLATE_ESTABLISHMENT_REQUEST_REVIEW = "mail/establishment-request-review";
    private static final String TEMPLATE_PAYMENT_REVIEW = "mail/payment-review";

    private final BrevoProperties brevoProperties;
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final String frontendBaseUrl;

    public BrevoNotificationService(
            BrevoProperties brevoProperties,
            JavaMailSender mailSender,
            TemplateEngine templateEngine,
            @Value("${app.frontend.base-url:}") String frontendBaseUrl) {
        this.brevoProperties = brevoProperties;
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendBookingCreatedToClient(Booking booking) {
        if (booking == null || booking.getUser() == null || isBlank(booking.getUser().getEmail())) {
            LOGGER.warn("No se pudo enviar correo al cliente: datos de usuario incompletos en la reserva");
            return;
        }

        String recipientEmail = booking.getUser().getEmail();
        String subject = "Reserva creada en Sigchos booking";

        String content = "Hola " + booking.getUser().getFirstName() + ",\n\n"
                + "Tu reserva fue creada correctamente.\n"
                + "Establecimiento: " + booking.getEstablishment().getName() + "\n"
                + "Habitacion: " + booking.getRoomUnit().getType().getName() + " (" + booking.getRoomUnit().getCode()
                + ")\n"
                + "Check-in: " + booking.getCheckInDate().format(DATE_FORMATTER) + "\n"
                + "Check-out: " + booking.getCheckOutDate().format(DATE_FORMATTER) + "\n"
                + "Estado: " + booking.getStatus().name() + "\n"
                + "Total: $" + booking.getTotalAmount() + "\n\n"
                + "Puedes gestionar tus reservas desde tu perfil en nuestro sitio web.\n"
                + "Si tienes alguna pregunta, no dudes en contactarnos.\n\n"
                + "Gracias por reservar con nosotros.";

        List<Map<String, String>> rows = List.of(
                row("Establecimiento", booking.getEstablishment().getName()),
                row("Habitacion",
                        booking.getRoomUnit().getType().getName() + " (" + booking.getRoomUnit().getCode() + ")"),
                row("Check-in", booking.getCheckInDate().format(DATE_FORMATTER)),
                row("Check-out", booking.getCheckOutDate().format(DATE_FORMATTER)),
                row("Estado", booking.getStatus().name()),
                row("Total", "$" + booking.getTotalAmount()));

        String htmlContent = renderTemplate(
                TEMPLATE_BOOKING_CLIENT,
                Map.of(
                        "senderName", senderName(),
                        "title", "Reserva creada exitosamente",
                        "subtitle",
                        "Tu reserva fue registrada y ahora esta en estado " + booking.getStatus().name() + ".",
                        "greetingName", valueOrDefault(booking.getUser().getFirstName(), "cliente"),
                        "rows", rows,
                        "bookingsUrl", buildBookingsUrl(),
                        "footer", "Gracias por reservar con nosotros."),
                content);

        sendEmail(recipientEmail, subject, content, htmlContent);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendBookingCreatedToEstablishmentAdmin(Booking booking) {
        try {
            if (booking == null
                    || booking.getEstablishment() == null
                    || booking.getEstablishment().getUser() == null
                    || booking.getUser() == null) {
                LOGGER.warn(
                        "No se pudo enviar correo al establishment admin : datos de establecimiento incompletos en la reserva");
                return;
            }

            String recipientEmail = booking.getEstablishment().getUser().getEmail();
            if (isBlank(recipientEmail)) {
                LOGGER.warn("No se pudo enviar correo al establishment admin : correo del administrador vacio");
                return;
            }

            String bookingUserEmail = booking.getUser() == null ? null : booking.getUser().getEmail();
            if (!isBlank(bookingUserEmail) && recipientEmail.equalsIgnoreCase(bookingUserEmail)) {
                LOGGER.info("Se omite correo al establishment admin  porque coincide con el correo del cliente: {}",
                        recipientEmail);
                return;
            }

            String subject = "Nueva reserva recibida";

            String content = "Hola " + booking.getEstablishment().getUser().getFirstName() + ",\n\n"
                    + "Se ha creado una nueva reserva en tu establecimiento.\n"
                    + "Cliente: " + booking.getUser().getFirstName() + " " + booking.getUser().getLastName() + "\n"
                    + "Correo cliente: " + booking.getUser().getEmail() + "\n"
                    + "Habitacion: " + booking.getRoomUnit().getType().getName() + " ("
                    + booking.getRoomUnit().getCode() + ")\n"
                    + "Check-in: " + booking.getCheckInDate().format(DATE_FORMATTER) + "\n"
                    + "Check-out: " + booking.getCheckOutDate().format(DATE_FORMATTER) + "\n"
                    + "Estado: " + booking.getStatus().name() + "\n"
                    + "Total: $" + booking.getTotalAmount() + "\n\n"
                    + "Revisa los detalles desde tu panel de reservas.";

            List<Map<String, String>> rows = List.of(
                    row("Cliente", booking.getUser().getFirstName() + " " + booking.getUser().getLastName()),
                    row("Correo cliente", booking.getUser().getEmail()),
                    row("Habitacion",
                            booking.getRoomUnit().getType().getName() + " (" + booking.getRoomUnit().getCode() + ")"),
                    row("Check-in", booking.getCheckInDate().format(DATE_FORMATTER)),
                    row("Check-out", booking.getCheckOutDate().format(DATE_FORMATTER)),
                    row("Estado", booking.getStatus().name()),
                    row("Total", "$" + booking.getTotalAmount()));

            String htmlContent = renderTemplate(
                    TEMPLATE_BOOKING_ADMIN,
                    Map.of(
                            "senderName", senderName(),
                            "title", "Nueva reserva recibida",
                            "subtitle", "Un cliente genero una nueva reserva en tu establecimiento.",
                            "greetingName",
                            valueOrDefault(booking.getEstablishment().getUser().getFirstName(), "administrador"),
                            "rows", rows,
                            "footer", "Revisa los detalles desde tu panel de reservas."),
                    content);

            sendEmail(recipientEmail, subject, content, htmlContent);
        } catch (Exception exception) {
            LOGGER.error("No se pudo preparar correo para establishment admin ", exception);
        }
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendPasswordRecovery(User user, String resetUrl, long expirationMinutes) {
        if (user == null || isBlank(user.getEmail())) {
            LOGGER.warn("No se pudo enviar correo de recuperacion: datos de usuario incompletos");
            return;
        }

        String subject = "Recuperacion de contraseña";
        String safeResetUrl = valueOrDefault(resetUrl, "");

        String content = "Hola " + user.getFirstName() + ",\n\n"
                + "Recibimos una solicitud para restablecer tu contraseña.\n"
                + "Usa el siguiente enlace para continuar:\n"
                + safeResetUrl + "\n\n"
                + "Este enlace expira en " + expirationMinutes + " minutos.\n"
                + "Si no solicitaste este cambio, ignora este correo.";

        String htmlContent = renderTemplate(
                TEMPLATE_PASSWORD_RECOVERY,
                Map.of(
                        "senderName", senderName(),
                        "title", "Recuperacion de contraseña",
                        "subtitle", "Recibimos una solicitud para restablecer tu contraseña.",
                        "greetingName", valueOrDefault(user.getFirstName(), "usuario"),
                        "expirationMinutes", expirationMinutes,
                        "resetUrl", safeResetUrl,
                        "footer", "Si no solicitaste este cambio, ignora este correo."),
                content);

        sendEmail(user.getEmail(), subject, content, htmlContent);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendMembershipRequestReviewed(
            String recipientEmail,
            String firstName,
            String lastName,
            boolean approved,
            String actionUrl,
            String tempPassword,
            String note) {
        if (isBlank(recipientEmail)) {
            LOGGER.warn("No se pudo enviar correo de membresia: correo vacio");
            return;
        }

        String subject = approved
                ? "Solicitud aprobada en Sigchos booking"
                : "Solicitud rechazada en Sigchos booking";

        String content = approved
                ? "Hola " + valueOrDefault(firstName, "usuario") + ",\n\n"
                        + "Tu solicitud para unirte fue aprobada.\n"
                        + "Tu contraseña temporal es: " + valueOrDefault(tempPassword, "") + "\n"
                        + "Ingresa en: " + valueOrDefault(actionUrl, "") + "\n\n"
                        + "Al iniciar sesion deberas completar tu perfil y cambiar la contraseña."
                : "Hola " + valueOrDefault(firstName, "usuario") + ",\n\n"
                        + "Tu solicitud para unirte fue revisada y no fue aprobada.\n"
                        + (isBlank(note) ? "" : "Motivo: " + note + "\n")
                        + "Puedes volver a enviar una nueva solicitud mas adelante.";

        Map<String, Object> variables = new HashMap<>();
        variables.put("senderName", senderName());
        variables.put("title", approved ? "Solicitud aprobada" : "Solicitud rechazada");
        variables.put("subtitle", approved
                ? "Tu acceso como establishment admin  ya fue habilitado."
                : "Tu solicitud no cumplio con los criterios de aprobacion.");
        variables.put("greetingName", valueOrDefault(firstName, "usuario") + " " + valueOrDefault(lastName, ""));
        variables.put("approved", approved);
        variables.put("actionUrl", valueOrDefault(actionUrl, ""));
        variables.put("tempPassword", valueOrDefault(tempPassword, ""));
        variables.put("note", valueOrDefault(note, ""));
        variables.put("footer", approved
                ? "Completa tu perfil y cambia tu contraseña al ingresar."
                : "Si deseas, puedes volver a enviar la solicitud con informacion actualizada.");

        String htmlContent = renderTemplate(TEMPLATE_MEMBERSHIP_REQUEST_REVIEW, variables, content);
        sendEmail(recipientEmail, subject, content, htmlContent);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendEstablishmentRequestReviewed(
            String recipientEmail,
            String firstName,
            String lastName,
            boolean approved,
            String establishmentName,
            String establishmentAddress,
            String actionUrl,
            String note) {
        if (isBlank(recipientEmail)) {
            LOGGER.warn("No se pudo enviar correo de solicitud de establecimiento: correo vacio");
            return;
        }

        String subject = approved ? "Solicitud de establecimiento aprobada" : "Solicitud de establecimiento rechazada";

        String content = approved
                ? "Hola " + valueOrDefault(firstName, "solicitante") + ",\n\n" +
                        "Tu solicitud para crear el establecimiento '" + valueOrDefault(establishmentName, "")
                        + "' fue aprobada.\n" +
                        "Direccion: " + valueOrDefault(establishmentAddress, "") + "\n\n" +
                        "Podras administrar tu establecimiento desde: " + valueOrDefault(actionUrl, "")
                : "Hola " + valueOrDefault(firstName, "solicitante") + ",\n\n" +
                        "Tu solicitud para crear el establecimiento '" + valueOrDefault(establishmentName, "")
                        + "' fue rechazada.\n" +
                        (isBlank(note) ? "" : "Motivo: " + note + "\n\n") +
                        "Si lo deseas, puedes enviar una nueva solicitud con informacion corregida.";

        Map<String, Object> variables = new HashMap<>();
        variables.put("senderName", senderName());
        variables.put("title", approved ? "Solicitud aprobada" : "Solicitud rechazada");
        variables.put("subtitle", approved ? "Tu establecimiento ya está disponible en la plataforma."
                : "La solicitud no pudo ser aprobada.");
        variables.put("greetingName", valueOrDefault(firstName, "solicitante") + " " + valueOrDefault(lastName, ""));
        variables.put("approved", approved);
        variables.put("establishmentName", valueOrDefault(establishmentName, ""));
        variables.put("establishmentAddress", valueOrDefault(establishmentAddress, ""));
        variables.put("actionUrl", valueOrDefault(actionUrl, ""));
        variables.put("note", valueOrDefault(note, ""));
        variables.put("footer", approved ? "Completa la informacion del establecimiento desde tu panel."
                : "Revisa los datos y vuelve a enviar la solicitud si corresponde.");

        String htmlContent = renderTemplate(TEMPLATE_ESTABLISHMENT_REQUEST_REVIEW, variables, content);
        sendEmail(recipientEmail, subject, content, htmlContent);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendPaymentValidationToClient(
            String recipientEmail,
            String firstName,
            String lastName,
            boolean approved,
            String bookingReference,
            String bookingDates,
            String amount,
            String note) {
        if (isBlank(recipientEmail)) {
            LOGGER.warn("No se pudo enviar correo de pago: correo vacio");
            return;
        }

        String subject = approved ? "Pago aprobado - Sigchos booking" : "Pago rechazado - Sigchos booking";

        String content = approved
                ? "Hola " + valueOrDefault(firstName, "cliente") + ",\n\n" +
                        "Tu pago " + valueOrDefault(bookingReference, "") + " por " + valueOrDefault(amount, "")
                        + " fue aprobado.\n" +
                        "Fechas: " + valueOrDefault(bookingDates, "") + "\n\n" +
                        "Gracias por tu reserva."
                : "Hola " + valueOrDefault(firstName, "cliente") + ",\n\n" +
                        "Tu pago " + valueOrDefault(bookingReference, "") + " por " + valueOrDefault(amount, "")
                        + " fue rechazado.\n" +
                        (isBlank(note) ? "" : "Motivo: " + note + "\n\n") +
                        "Si lo deseas, puedes volver a enviar el comprobante de pago o contactar al establecimiento.";

        Map<String, Object> variables = new HashMap<>();
        variables.put("senderName", senderName());
        variables.put("title", approved ? "Pago aprobado" : "Pago rechazado");
        variables.put("subtitle",
                approved ? "Hemos verificado tu pago correctamente." : "El pago fue rechazado tras la verificacion.");
        variables.put("greetingName", valueOrDefault(firstName, "cliente") + " " + valueOrDefault(lastName, ""));
        variables.put("approved", approved);
        variables.put("bookingReference", valueOrDefault(bookingReference, ""));
        variables.put("bookingDates", valueOrDefault(bookingDates, ""));
        variables.put("amount", valueOrDefault(amount, ""));
        variables.put("note", valueOrDefault(note, ""));
        variables.put("footer",
                approved ? "Gracias por reservar con nosotros." : "Contacta con el establecimiento para mas detalles.");

        String htmlContent = renderTemplate(TEMPLATE_PAYMENT_REVIEW, variables, content);
        sendEmail(recipientEmail, subject, content, htmlContent);
    }

    // ── Métodos privados de soporte ──────────────────────────────────────────────

    private void sendEmail(String toEmail, String subject, String textContent, String htmlContent) {
        if (!brevoProperties.isEnabled()) {
            return;
        }

        if (isBlank(brevoProperties.getSenderEmail())) {
            LOGGER.warn("Correo remitente no configurado. No se envio el correo a {}", toEmail);
            return;
        }

        try {
            String originalRecipient = toEmail;
            String effectiveRecipient = resolveRecipient(toEmail);
            String effectiveSubject = buildEffectiveSubject(subject, originalRecipient, effectiveRecipient);
            sendMimeMessage(effectiveRecipient, effectiveSubject, textContent, htmlContent);
        } catch (Exception exception) {
            LOGGER.error("No se pudo enviar correo a {}", toEmail, exception);
        }
    }

    private String renderTemplate(String templateName, Map<String, Object> variables, String textFallback) {
        Context context = new Context();
        context.setVariables(variables);

        try {
            return templateEngine.process(templateName, context);
        } catch (Exception exception) {
            LOGGER.error("No se pudo renderizar la plantilla {}. Se usara fallback HTML.", templateName, exception);
            return basicHtmlFallback(textFallback);
        }
    }

    private String basicHtmlFallback(String textContent) {
        String escaped = escapeHtml(valueOrDefault(textContent, ""));
        return "<html><body style=\"font-family:Arial,Helvetica,sans-serif;color:#12263a;\"><p>"
                + escaped.replace("\n", "<br/>")
                + "</p></body></html>";
    }

    private void sendMimeMessage(String effectiveRecipient, String effectiveSubject, String textContent,
            String htmlContent)
            throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(brevoProperties.getSenderEmail());
        helper.setTo(effectiveRecipient);
        helper.setSubject(effectiveSubject);
        helper.setText(textContent, htmlContent);

        mailSender.send(message);
    }

    private String resolveRecipient(String toEmail) {
        if (!isBlank(brevoProperties.getOverrideToEmail())) {
            return brevoProperties.getOverrideToEmail().trim();
        }

        return toEmail;
    }

    private String senderName() {
        return isBlank(brevoProperties.getSenderName()) ? "Sigchos booking" : brevoProperties.getSenderName();
    }

    private String buildBookingsUrl() {
        if (isBlank(frontendBaseUrl)) {
            return "/bookings";
        }

        String normalizedBase = frontendBaseUrl.endsWith("/")
                ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                : frontendBaseUrl;
        return normalizedBase + "/bookings";
    }

    private String buildEffectiveSubject(String subject, String originalRecipient, String effectiveRecipient) {
        if (originalRecipient != null && originalRecipient.equalsIgnoreCase(effectiveRecipient)) {
            return subject;
        }

        return "[TEST para " + originalRecipient + "] " + subject;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String valueOrDefault(String value, String defaultValue) {
        if (isBlank(value)) {
            return defaultValue;
        }
        return value;
    }

    private Map<String, String> row(String label, String value) {
        return Map.of(
                "label", valueOrDefault(label, ""),
                "value", valueOrDefault(value, ""));
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

}
