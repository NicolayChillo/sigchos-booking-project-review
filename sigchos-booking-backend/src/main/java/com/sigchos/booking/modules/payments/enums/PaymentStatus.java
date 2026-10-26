package com.sigchos.booking.modules.payments.enums;

public enum PaymentStatus {
    CREATED, // Pago creado para checkout (payphone)
    PENDING, // Pago registrado, esperando comprobante o validación
    APPROVED, // Pago verificado y aceptado
    REJECTED, // Pago rechazado (ej. comprobante falso o monto incorrecto)
    REFUNDED, // Pago con devolucion (ej. cancelacion de reserva)
    CANCELLED // checkout PayPhone abandonado o expirado.
}
