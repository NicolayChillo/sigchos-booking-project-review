package com.sigchos.booking.modules.room_units.enums;

public enum RoomUnitStatus {
    AVAILABLE, // Lista para recibir huéspedes
    OCCUPIED, // El huésped está actualmente en la habitación (Check-in hecho)
    RESERVED, // Bloqueada para una reserva próxima (Check-in pendiente)
    MAINTENANCE, // Fuera de servicio por reparaciones
    OUT_OF_ORDER // Bloqueada por tiempo indefinido
}