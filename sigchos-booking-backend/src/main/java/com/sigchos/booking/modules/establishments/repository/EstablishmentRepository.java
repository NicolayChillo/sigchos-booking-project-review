package com.sigchos.booking.modules.establishments.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.sigchos.booking.modules.establishments.model.Establishment;

public interface EstablishmentRepository extends JpaRepository<Establishment, Long> {
    List<Establishment> findAllByIsActiveTrue();

    @Query("""
            SELECT e
            FROM Establishment e
            WHERE e.isActive = true
                AND EXISTS (
                    SELECT rt.id
                    FROM RoomType rt
                    WHERE rt.establishment.id = e.id
                        AND rt.isActive = true
                        AND EXISTS (
                            SELECT ru.id
                            FROM RoomUnit ru
                            WHERE ru.type.id = rt.id
                                AND ru.isActive = true
                        )
                )
                AND (
                    (e.payphoneToken IS NOT NULL AND e.payphoneToken <> ''
                        AND e.payphoneStoreId IS NOT NULL AND e.payphoneStoreId <> '')
                    OR
                    (e.bankName IS NOT NULL AND e.bankName <> ''
                        AND e.bankAccountType IS NOT NULL AND e.bankAccountType <> ''
                        AND e.bankAccountNumber IS NOT NULL AND e.bankAccountNumber <> ''
                        AND e.bankAccountOwnerName IS NOT NULL AND e.bankAccountOwnerName <> ''
                        AND e.bankAccountOwnerId IS NOT NULL AND e.bankAccountOwnerId <> '')
                )
            """)
    List<Establishment> findAllPublicWithActiveRoomInventory();

    List<Establishment> findByUser_Id(Long userId);

    List<Establishment> findByUser_IdAndIsActiveTrue(Long userId);

    Optional<Establishment> findByIdAndIsActiveTrue(Long id);

    Optional<Establishment> findByIdAndUser_Id(Long id, Long userId);

    boolean existsByNameIgnoreCaseAndUser_Id(String name, Long userId);

    boolean existsByNameIgnoreCaseAndIdNotAndUser_Id(String name, Long id, Long userId);
}
