package com.sigchos.booking.modules.bookings.repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sigchos.booking.modules.bookings.enums.BookingStatus;
import com.sigchos.booking.modules.bookings.model.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    List<Booking> findByUser_IdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByUser_IdAndStatusOrderByCreatedAtDesc(Long userId, BookingStatus status);

    List<Booking> findByEstablishment_User_IdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByEstablishment_User_IdAndStatusOrderByCreatedAtDesc(Long userId, BookingStatus status);

    boolean existsByRoomUnit_IdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
            Long roomUnitId,
            Collection<BookingStatus> statuses,
            LocalDate checkOutDate,
            LocalDate checkInDate);

    boolean existsByRoomUnit_IdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThanAndIdNot(
            Long roomUnitId,
            Collection<BookingStatus> statuses,
            LocalDate checkOutDate,
            LocalDate checkInDate,
            Long id);
}
