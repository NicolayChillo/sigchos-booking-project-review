package com.sigchos.booking.modules.room_units.repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import com.sigchos.booking.modules.bookings.enums.BookingStatus;
import com.sigchos.booking.modules.room_units.enums.RoomUnitStatus;
import com.sigchos.booking.modules.room_units.model.RoomUnit;

public interface RoomUnitRepository extends JpaRepository<RoomUnit, Long> {
    List<RoomUnit> findByType_Id(Long roomTypeId);

    Optional<RoomUnit> findByIdAndIsActiveTrue(Long id);

    List<RoomUnit> findByType_IdAndIsActiveTrue(Long roomTypeId);

    List<RoomUnit> findByType_IdAndIsActiveFalse(Long roomTypeId);

    List<RoomUnit> findByType_IdAndIsActiveTrueAndStatusOrderByCodeAsc(Long roomTypeId, RoomUnitStatus status);

        @Query("""
                        SELECT ru
                        FROM RoomUnit ru
                        WHERE ru.type.id = :roomTypeId
                            AND ru.isActive = true
                            AND ru.status = :roomUnitStatus
                            AND NOT EXISTS (
                                SELECT b.id
                                FROM Booking b
                                WHERE b.roomUnit.id = ru.id
                                    AND b.status IN :bookingStatuses
                                    AND b.checkInDate < :checkOutDate
                                    AND b.checkOutDate > :checkInDate
                            )
                        ORDER BY ru.code ASC
                        """)
        List<RoomUnit> findAvailableByRoomTypeAndDateRange(
                        @Param("roomTypeId") Long roomTypeId,
                        @Param("roomUnitStatus") RoomUnitStatus roomUnitStatus,
                        @Param("bookingStatuses") Collection<BookingStatus> bookingStatuses,
                        @Param("checkInDate") LocalDate checkInDate,
                        @Param("checkOutDate") LocalDate checkOutDate);

    boolean existsByCodeIgnoreCaseAndType_Establishment_Id(String name, Long establishmentId);

    boolean existsByCodeIgnoreCaseAndType_Establishment_IdAndIdNot(String name, Long establishmentId, Long id);

    boolean existsByType_IdAndIsActiveTrueAndStatus(Long roomTypeId, RoomUnitStatus status);

}
