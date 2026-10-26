package com.sigchos.booking.modules.room_types.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sigchos.booking.modules.room_types.models.RoomType;

public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {
    boolean existsByIdAndIsActiveTrue(Long id);

    List<RoomType> findByEstablishment_Id(Long establishmentId);

    List<RoomType> findByEstablishment_IdAndIsActiveTrue(Long establishmentId);

    List<RoomType> findByEstablishment_IdAndIsActiveFalse(Long establishmentId);

    boolean existsByEstablishment_IdAndNameIgnoreCase(Long establishmentId, String name);

    boolean existsByEstablishment_IdAndNameIgnoreCaseAndIdNot(Long establishmentId, String name, Long id);

    Optional<RoomType> findByIdAndIsActiveTrue(Long id);
}
