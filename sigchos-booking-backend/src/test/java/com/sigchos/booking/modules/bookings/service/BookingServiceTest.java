package com.sigchos.booking.modules.bookings.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.bookings.dto.BookingCreateRequest;
import com.sigchos.booking.modules.bookings.dto.BookingRescheduleRequest;
import com.sigchos.booking.modules.bookings.dto.BookingResponse;
import com.sigchos.booking.modules.bookings.enums.BookingStatus;
import com.sigchos.booking.modules.bookings.model.Booking;
import com.sigchos.booking.modules.bookings.repository.BookingRepository;
import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.notifications.service.EmailNotificationService;
import com.sigchos.booking.modules.payments.repositories.PaymentRepository;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.room_types.models.RoomType;
import com.sigchos.booking.modules.room_units.enums.RoomUnitStatus;
import com.sigchos.booking.modules.room_units.model.RoomUnit;
import com.sigchos.booking.modules.room_units.repository.RoomUnitRepository;
import com.sigchos.booking.modules.user.model.User;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingService — Pruebas unitarias")
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private RoomUnitRepository roomUnitRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private EmailNotificationService emailNotificationService;

    @InjectMocks
    private BookingService bookingService;

    // ─── Helpers de fixture ──────────────────────────────────────────────────

    private User clientUser(Long id) {
        User u = new User();
        u.setId(id);
        u.setRole(Role.CLIENT);
        u.setActive(true);
        u.setEmail("client" + id + "@test.com");
        u.setFirstName("Client");
        u.setLastName("Test");
        u.setPhone("0999999999");
        u.setPassword("hashed");
        return u;
    }

    private User adminUser(Long id) {
        User u = new User();
        u.setId(id);
        u.setRole(Role.ESTABLISHMENT_ADMIN);
        u.setActive(true);
        u.setEmail("admin" + id + "@test.com");
        u.setFirstName("Admin");
        u.setLastName("Test");
        u.setPhone("0999999999");
        u.setPassword("hashed");
        return u;
    }

    private User systemAdmin(Long id) {
        User u = new User();
        u.setId(id);
        u.setRole(Role.SYSTEM_ADMIN);
        u.setActive(true);
        return u;
    }

    private Establishment establishment(Long id, User owner) {
        return Establishment.builder()
                .id(id)
                .user(owner)
                .name("Hotel Test")
                .address("Calle Principal 1")
                .isActive(true)
                .build();
    }

    private RoomType roomType(Establishment est, boolean requiresAdvance, Integer advancePercent) {
        return RoomType.builder()
                .id(1L)
                .establishment(est)
                .name("Suite")
                .description("Suite de lujo")
                .capacity(2)
                .pricePerNight(BigDecimal.valueOf(100))
                .isActive(true)
                .requiresAdvancePayment(requiresAdvance)
                .advancePaymentPercentage(advancePercent)
                .build();
    }

    private RoomUnit availableRoomUnit(Long id, RoomType type) {
        return RoomUnit.builder()
                .id(id)
                .type(type)
                .code("R-" + id)
                .status(RoomUnitStatus.AVAILABLE)
                .isActive(true)
                .build();
    }

    private Booking pendingBooking(Long id, User client, RoomUnit unit, Establishment est) {
        return Booking.builder()
                .id(id)
                .user(client)
                .roomUnit(unit)
                .establishment(est)
                .checkInDate(LocalDate.now().plusDays(1))
                .checkOutDate(LocalDate.now().plusDays(3))
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(200))
                .advancePaymentAmount(BigDecimal.ZERO)
                .advancePaymentPercentage(0)
                .build();
    }

    // ─── Crear reserva ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("create()")
    class CreateBooking {

        @Test
        @DisplayName("Debe lanzar 400 si checkInDate está en el pasado")
        void shouldThrow400WhenCheckInIsPast() {
            User client = clientUser(1L);
            BookingCreateRequest dto = new BookingCreateRequest(
                    1L,
                    LocalDate.now().minusDays(1),
                    LocalDate.now().plusDays(2));

            assertThatThrownBy(() -> bookingService.create(client, dto))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("checkInDate cannot be in the past");
        }

        @Test
        @DisplayName("Debe lanzar 400 si checkIn >= checkOut")
        void shouldThrow400WhenCheckInAfterCheckOut() {
            User client = clientUser(1L);
            BookingCreateRequest dto = new BookingCreateRequest(
                    1L,
                    LocalDate.now().plusDays(3),
                    LocalDate.now().plusDays(1));

            assertThatThrownBy(() -> bookingService.create(client, dto))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("checkInDate must be earlier than checkOutDate");
        }

        @Test
        @DisplayName("Debe lanzar 404 si la habitación no existe o está inactiva")
        void shouldThrow404WhenRoomUnitNotFound() {
            User client = clientUser(1L);
            BookingCreateRequest dto = new BookingCreateRequest(
                    99L,
                    LocalDate.now().plusDays(1),
                    LocalDate.now().plusDays(3));

            when(roomUnitRepository.findByIdAndIsActiveTrue(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> bookingService.create(client, dto))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Room unit not found or is inactive");
        }

        @Test
        @DisplayName("Debe lanzar 409 si la habitación está en mantenimiento")
        void shouldThrow409WhenRoomUnitInMaintenance() {
            User client = clientUser(1L);
            User owner = adminUser(2L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, false, 0);
            RoomUnit unit = availableRoomUnit(1L, type);
            unit.setStatus(RoomUnitStatus.MAINTENANCE);

            BookingCreateRequest dto = new BookingCreateRequest(
                    1L,
                    LocalDate.now().plusDays(1),
                    LocalDate.now().plusDays(3));

            when(roomUnitRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(unit));

            assertThatThrownBy(() -> bookingService.create(client, dto))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Room unit is not available for booking");
        }

        @Test
        @DisplayName("Debe lanzar 409 si hay solapamiento de fechas")
        void shouldThrow409WhenDatesOverlap() {
            User client = clientUser(1L);
            User owner = adminUser(2L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, false, 0);
            RoomUnit unit = availableRoomUnit(1L, type);

            LocalDate checkIn = LocalDate.now().plusDays(1);
            LocalDate checkOut = LocalDate.now().plusDays(5);
            BookingCreateRequest dto = new BookingCreateRequest(1L, checkIn, checkOut);

            when(roomUnitRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(unit));
            when(bookingRepository.existsByRoomUnit_IdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                    anyLong(), anyList(), any(), any())).thenReturn(true);

            assertThatThrownBy(() -> bookingService.create(client, dto))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Room unit is not available for the selected date range");
        }

        @Test
        @DisplayName("Flujo feliz sin anticipo: debe guardar y retornar la respuesta correctamente")
        void shouldCreateBookingSuccessfullyWithoutAdvance() {
            User client = clientUser(1L);
            User owner = adminUser(2L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, false, 0);
            RoomUnit unit = availableRoomUnit(1L, type);

            LocalDate checkIn = LocalDate.now().plusDays(1);
            LocalDate checkOut = LocalDate.now().plusDays(3);  // 2 noches = $200
            BookingCreateRequest dto = new BookingCreateRequest(1L, checkIn, checkOut);

            when(roomUnitRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(unit));
            when(bookingRepository.existsByRoomUnit_IdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                    anyLong(), anyList(), any(), any())).thenReturn(false);
            when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
                Booking b = inv.getArgument(0);
                b.setId(10L);
                return b;
            });
            doNothing().when(emailNotificationService).sendBookingCreatedToClient(any());
            doNothing().when(emailNotificationService).sendBookingCreatedToEstablishmentAdmin(any());

            BookingResponse response = bookingService.create(client, dto);

            assertThat(response).isNotNull();
            assertThat(response.status()).isEqualTo(BookingStatus.PENDING);
            assertThat(response.totalAmount()).isEqualByComparingTo(BigDecimal.valueOf(200.00));
            assertThat(response.advancePaymentPercentage()).isEqualTo(0);
            assertThat(response.advancePaymentAmount()).isEqualByComparingTo(BigDecimal.ZERO);
            verify(bookingRepository).save(any(Booking.class));
            verify(emailNotificationService).sendBookingCreatedToClient(any());
        }

        @Test
        @DisplayName("Flujo feliz con anticipo del 30%: debe calcular correctamente el monto anticipado")
        void shouldCreateBookingWithAdvancePaymentCorrectly() {
            User client = clientUser(1L);
            User owner = adminUser(2L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, true, 30);
            RoomUnit unit = availableRoomUnit(1L, type);

            LocalDate checkIn = LocalDate.now().plusDays(1);
            LocalDate checkOut = LocalDate.now().plusDays(3);  // 2 noches = $200, anticipo = $60
            BookingCreateRequest dto = new BookingCreateRequest(1L, checkIn, checkOut);

            when(roomUnitRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(unit));
            when(bookingRepository.existsByRoomUnit_IdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                    anyLong(), anyList(), any(), any())).thenReturn(false);
            when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
                Booking b = inv.getArgument(0);
                b.setId(11L);
                return b;
            });
            doNothing().when(emailNotificationService).sendBookingCreatedToClient(any());
            doNothing().when(emailNotificationService).sendBookingCreatedToEstablishmentAdmin(any());

            BookingResponse response = bookingService.create(client, dto);

            assertThat(response.advancePaymentPercentage()).isEqualTo(30);
            assertThat(response.advancePaymentAmount()).isEqualByComparingTo(BigDecimal.valueOf(60.00));
        }

        @Test
        @DisplayName("Debe lanzar 401 si el usuario es null (no autenticado)")
        void shouldThrow401WhenUserIsNull() {
            BookingCreateRequest dto = new BookingCreateRequest(
                    1L, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3));

            assertThatThrownBy(() -> bookingService.create(null, dto))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Authentication is required");
        }
    }

    // ─── Cancelar reserva ────────────────────────────────────────────────────

    @Nested
    @DisplayName("cancel()")
    class CancelBooking {

        @Test
        @DisplayName("Debe ser idempotente si la reserva ya está CANCELED")
        void shouldBeIdempotentWhenAlreadyCanceled() {
            User client = clientUser(1L);
            User owner = adminUser(2L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, false, 0);
            RoomUnit unit = availableRoomUnit(1L, type);
            Booking booking = pendingBooking(1L, client, unit, est);
            booking.setStatus(BookingStatus.CANCELED);

            when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

            BookingResponse response = bookingService.cancel(client, 1L);

            assertThat(response.status()).isEqualTo(BookingStatus.CANCELED);
        }

        @Test
        @DisplayName("Debe cancelar correctamente una reserva PENDING propia del cliente")
        void shouldCancelPendingBooking() {
            User client = clientUser(1L);
            User owner = adminUser(2L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, false, 0);
            RoomUnit unit = availableRoomUnit(1L, type);
            Booking booking = pendingBooking(1L, client, unit, est);

            when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

            BookingResponse response = bookingService.cancel(client, 1L);

            assertThat(response.status()).isEqualTo(BookingStatus.CANCELED);
        }

        @Test
        @DisplayName("Cliente no debe poder cancelar la reserva de otro usuario (403)")
        void shouldThrow403WhenClientCancelsOtherUsersBooking() {
            User client1 = clientUser(1L);
            User client2 = clientUser(2L);
            User owner = adminUser(3L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, false, 0);
            RoomUnit unit = availableRoomUnit(1L, type);
            Booking booking = pendingBooking(1L, client1, unit, est);

            when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> bookingService.cancel(client2, 1L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("You do not have access to this booking");
        }
    }

    // ─── Confirmar reserva ───────────────────────────────────────────────────

    @Nested
    @DisplayName("confirm()")
    class ConfirmBooking {

        @Test
        @DisplayName("Solo ESTABLISHMENT_ADMIN puede confirmar (CLIENT recibe 403)")
        void shouldThrow403WhenClientTriesToConfirm() {
            User client = clientUser(1L);
            User owner = adminUser(2L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, false, 0);
            RoomUnit unit = availableRoomUnit(1L, type);
            Booking booking = pendingBooking(1L, client, unit, est);

            when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> bookingService.confirm(client, 1L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Only establishment admin");
        }

        @Test
        @DisplayName("Debe lanzar 409 cuando se intenta confirmar una reserva CANCELED")
        void shouldThrow409WhenConfirmingCanceledBooking() {
            User owner = adminUser(2L);
            User client = clientUser(1L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, false, 0);
            RoomUnit unit = availableRoomUnit(1L, type);
            Booking booking = pendingBooking(1L, client, unit, est);
            booking.setStatus(BookingStatus.CANCELED);

            when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> bookingService.confirm(owner, 1L))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Canceled bookings cannot be confirmed");
        }

        @Test
        @DisplayName("Flujo feliz: ESTABLISHMENT_ADMIN confirma su propia reserva → ADVANCE_CONFIRMED")
        void shouldConfirmBookingSuccessfully() {
            User owner = adminUser(2L);
            User client = clientUser(1L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, false, 0);
            RoomUnit unit = availableRoomUnit(1L, type);
            Booking booking = pendingBooking(1L, client, unit, est);

            when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

            BookingResponse response = bookingService.confirm(owner, 1L);

            assertThat(response.status()).isEqualTo(BookingStatus.ADVANCE_CONFIRMED);
        }
    }

    // ─── Reprogramar reserva ─────────────────────────────────────────────────

    @Nested
    @DisplayName("reschedule()")
    class RescheduleBooking {

        @Test
        @DisplayName("Debe lanzar 409 si la reserva está CANCELED")
        void shouldThrow409WhenReschedulingCanceledBooking() {
            User client = clientUser(1L);
            User owner = adminUser(2L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, false, 0);
            RoomUnit unit = availableRoomUnit(1L, type);
            Booking booking = pendingBooking(1L, client, unit, est);
            booking.setStatus(BookingStatus.CANCELED);

            BookingRescheduleRequest dto = new BookingRescheduleRequest(
                    LocalDate.now().plusDays(5),
                    LocalDate.now().plusDays(7));

            when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> bookingService.reschedule(client, 1L, dto))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Canceled bookings cannot be rescheduled");
        }

        @Test
        @DisplayName("Con pagos existentes, cambiar el número de noches debe lanzar 400")
        void shouldThrow400WhenChangingNightsWithExistingPayments() {
            User client = clientUser(1L);
            User owner = adminUser(2L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, false, 0);
            RoomUnit unit = availableRoomUnit(1L, type);
            // booking actual: 2 noches (días 1 a 3)
            Booking booking = pendingBooking(1L, client, unit, est);

            // nuevo request: 3 noches (días 5 a 8) → distinto número de noches
            BookingRescheduleRequest dto = new BookingRescheduleRequest(
                    LocalDate.now().plusDays(5),
                    LocalDate.now().plusDays(8));

            when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
            // simula que ya hay pagos
            when(paymentRepository.findByBooking_Id(1L)).thenReturn(List.of(new com.sigchos.booking.modules.payments.models.Payment()));

            assertThatThrownBy(() -> bookingService.reschedule(client, 1L, dto))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("same number of nights");
        }

        @Test
        @DisplayName("Sin pagos y estado PENDING: puede cambiar el número de noches")
        void shouldAllowChangingNightsWithoutPayments() {
            User client = clientUser(1L);
            User owner = adminUser(2L);
            Establishment est = establishment(1L, owner);
            RoomType type = roomType(est, false, 0);
            RoomUnit unit = availableRoomUnit(1L, type);
            // booking actual: 2 noches
            Booking booking = pendingBooking(1L, client, unit, est);

            // nuevo request: 3 noches
            LocalDate newCheckIn = LocalDate.now().plusDays(5);
            LocalDate newCheckOut = LocalDate.now().plusDays(8);
            BookingRescheduleRequest dto = new BookingRescheduleRequest(newCheckIn, newCheckOut);

            when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
            when(paymentRepository.findByBooking_Id(1L)).thenReturn(Collections.emptyList());
            when(bookingRepository.existsByRoomUnit_IdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThanAndIdNot(
                    anyLong(), anyList(), any(), any(), anyLong())).thenReturn(false);

            BookingResponse response = bookingService.reschedule(client, 1L, dto);

            assertThat(response.checkInDate()).isEqualTo(newCheckIn);
            assertThat(response.checkOutDate()).isEqualTo(newCheckOut);
            assertThat(response.nights()).isEqualTo(3L);
        }
    }

    // ─── Listar reservas visibles ─────────────────────────────────────────────

    @Nested
    @DisplayName("findAllVisible()")
    class FindAllVisible {

        @Test
        @DisplayName("CLIENT solo ve sus propias reservas")
        void clientShouldOnlySeeOwnBookings() {
            User client = clientUser(1L);
            when(bookingRepository.findByUser_IdOrderByCreatedAtDesc(eq(1L)))
                    .thenReturn(Collections.emptyList());

            List<BookingResponse> result = bookingService.findAllVisible(client, null);

            assertThat(result).isEmpty();
            verify(bookingRepository).findByUser_IdOrderByCreatedAtDesc(1L);
            verify(bookingRepository, never())
                    .findByEstablishment_User_IdOrderByCreatedAtDesc(anyLong());
        }

        @Test
        @DisplayName("ESTABLISHMENT_ADMIN ve las reservas de su establecimiento")
        void adminShouldSeeOwnEstablishmentBookings() {
            User admin = adminUser(2L);
            when(bookingRepository.findByEstablishment_User_IdOrderByCreatedAtDesc(eq(2L)))
                    .thenReturn(Collections.emptyList());

            List<BookingResponse> result = bookingService.findAllVisible(admin, null);

            assertThat(result).isEmpty();
            verify(bookingRepository).findByEstablishment_User_IdOrderByCreatedAtDesc(2L);
            verify(bookingRepository, never()).findByUser_IdOrderByCreatedAtDesc(anyLong());
        }

        @Test
        @DisplayName("SYSTEM_ADMIN debe recibir 403 al intentar listar reservas")
        void systemAdminShouldGet403() {
            User sysAdmin = systemAdmin(99L);

            assertThatThrownBy(() -> bookingService.findAllVisible(sysAdmin, null))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Only clients and establishment admin");
        }
    }
}
