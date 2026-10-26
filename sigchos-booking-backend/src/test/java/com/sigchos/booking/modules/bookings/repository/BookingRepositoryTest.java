package com.sigchos.booking.modules.bookings.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import com.sigchos.booking.modules.bookings.enums.BookingStatus;
import com.sigchos.booking.modules.bookings.model.Booking;
import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.room_types.models.RoomType;
import com.sigchos.booking.modules.room_types.enums.RoomCategory;
import com.sigchos.booking.modules.room_units.model.RoomUnit;
import com.sigchos.booking.modules.room_units.enums.RoomUnitStatus;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.user.model.User;

@DataJpaTest
@ActiveProfiles("test")
class BookingRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private BookingRepository bookingRepository;

    private User client;
    private Establishment establishment;
    private RoomUnit roomUnit;

    @BeforeEach
    void setUp() {
        // 1. Crear usuario cliente
        client = new User();
        client.setFirstName("Juan");
        client.setLastName("Perez");
        client.setEmail("juan@test.com");
        client.setPassword("Pass123!");
        client.setPhone("0999999999");
        client.setRole(Role.CLIENT);
        client.setActive(true);
        client.setProfileCompleted(true);
        client = entityManager.persist(client);

        // 2. Crear usuario admin de establecimiento
        User admin = new User();
        admin.setFirstName("Admin");
        admin.setLastName("Hotel");
        admin.setEmail("admin@hotel.com");
        admin.setPassword("Pass123!");
        admin.setPhone("0988888888");
        admin.setRole(Role.ESTABLISHMENT_ADMIN);
        admin.setActive(true);
        admin.setProfileCompleted(true);
        admin = entityManager.persist(admin);

        // 3. Crear establecimiento
        establishment = new Establishment();
        establishment.setUser(admin);
        establishment.setName("Hotel Test");
        establishment.setDescription("Test Desc");
        establishment.setAddress("Test Addr");
        establishment.setBankAccountType("Ahorros");
        establishment.setBankName("Pichincha");
        establishment.setBankAccountNumber("1234567890");
        establishment.setBankAccountOwnerName("Rep");
        establishment.setBankAccountOwnerId("1700000000");
        establishment.setCancellationPolicy("Ninguna");
        establishment.setCancelPenaltyWindowHours(24);
        establishment.setCancelPenaltyAfterEnabled(false);
        establishment.setActive(true);
        establishment = entityManager.persist(establishment);

        // 4. Crear RoomType
        RoomType roomType = new RoomType();
        roomType.setEstablishment(establishment);
        roomType.setName("Doble");
        roomType.setDescription("Habitacion doble");
        roomType.setCapacity(2);
        roomType.setCategory(RoomCategory.HOTEL_ROOM);
        roomType.setPricePerNight(new BigDecimal("50.00"));
        roomType.setActive(true);
        roomType = entityManager.persist(roomType);

        // 5. Crear RoomUnit
        roomUnit = new RoomUnit();
        roomUnit.setType(roomType);
        roomUnit.setCode("101");
        roomUnit.setStatus(RoomUnitStatus.AVAILABLE);
        roomUnit = entityManager.persist(roomUnit);
    }

    @Test
    @DisplayName("Debe encontrar reservas ordenadas por fecha de creacion descendente")
    void testFindAllByOrderByCreatedAtDesc() throws InterruptedException {
        Booking b1 = createBooking(LocalDate.now(), LocalDate.now().plusDays(2), BookingStatus.PENDING);
        
        // Forzar un milisegundo de diferencia para que createdAt sea estrictamente mayor
        Thread.sleep(10);
        
        Booking b2 = createBooking(LocalDate.now().plusDays(3), LocalDate.now().plusDays(5), BookingStatus.PENDING);

        List<Booking> bookings = bookingRepository.findAllByOrderByCreatedAtDesc();

        assertThat(bookings).hasSize(2);
        assertThat(bookings.get(0).getId()).isEqualTo(b2.getId()); // El último insertado primero
    }

    @Test
    @DisplayName("Debe filtrar reservas por status")
    void testFindByStatusOrderByCreatedAtDesc() {
        createBooking(LocalDate.now(), LocalDate.now().plusDays(2), BookingStatus.PENDING);
        createBooking(LocalDate.now().plusDays(3), LocalDate.now().plusDays(5), BookingStatus.CANCELED);

        List<Booking> pendingBookings = bookingRepository.findByStatusOrderByCreatedAtDesc(BookingStatus.PENDING);

        assertThat(pendingBookings).hasSize(1);
        assertThat(pendingBookings.get(0).getStatus()).isEqualTo(BookingStatus.PENDING);
    }

    @Test
    @DisplayName("Verifica si existe superposicion de fechas (existsByRoomUnit_IdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan)")
    void testOverlapQuery() {
        // Reservamos del 10 al 15
        LocalDate checkIn = LocalDate.of(2026, 8, 10);
        LocalDate checkOut = LocalDate.of(2026, 8, 15);
        createBooking(checkIn, checkOut, BookingStatus.ADVANCE_CONFIRMED);

        List<BookingStatus> blockingStatuses = List.of(BookingStatus.PENDING, BookingStatus.ADVANCE_CONFIRMED, BookingStatus.COMPLETED);

        // Solapamiento: 12 al 16 (empieza antes de que termine)
        boolean overlap1 = bookingRepository.existsByRoomUnit_IdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                roomUnit.getId(), blockingStatuses, LocalDate.of(2026, 8, 16), LocalDate.of(2026, 8, 12));
        assertThat(overlap1).isTrue();

        // Sin solapamiento: 15 al 20 (empieza justo cuando termina el otro, el checkout date es exclusive usualmente)
        boolean overlap2 = bookingRepository.existsByRoomUnit_IdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                roomUnit.getId(), blockingStatuses, LocalDate.of(2026, 8, 20), LocalDate.of(2026, 8, 15));
        assertThat(overlap2).isFalse();
    }

    private Booking createBooking(LocalDate checkIn, LocalDate checkOut, BookingStatus status) {
        Booking booking = Booking.builder()
                .user(client)
                .establishment(establishment)
                .roomUnit(roomUnit)
                .checkInDate(checkIn)
                .checkOutDate(checkOut)
                .status(status)
                .advancePaymentPercentage(50)
                .advancePaymentAmount(new BigDecimal("25.00"))
                .totalAmount(new BigDecimal("50.00"))
                .build();
        return entityManager.persist(booking);
    }
}
