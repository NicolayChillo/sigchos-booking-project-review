package com.sigchos.booking.modules.bookings.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.bookings.dto.BookingCreateRequest;
import com.sigchos.booking.modules.bookings.dto.BookingRescheduleRequest;
import com.sigchos.booking.modules.bookings.dto.BookingResponse;
import com.sigchos.booking.modules.bookings.enums.BookingStatus;
import com.sigchos.booking.modules.bookings.mapper.BookingMapper;
import com.sigchos.booking.modules.bookings.model.Booking;
import com.sigchos.booking.modules.bookings.repository.BookingRepository;
import com.sigchos.booking.modules.notifications.service.EmailNotificationService;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.payments.repositories.PaymentRepository;
import com.sigchos.booking.modules.room_units.enums.RoomUnitStatus;
import com.sigchos.booking.modules.room_units.model.RoomUnit;
import com.sigchos.booking.modules.room_units.repository.RoomUnitRepository;
import com.sigchos.booking.modules.user.model.User;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
@Transactional(readOnly = true)
public class BookingService {
    private static final List<BookingStatus> BLOCKING_STATUSES = List.of(
            BookingStatus.PENDING,
            BookingStatus.ADVANCE_CONFIRMED,
            BookingStatus.COMPLETED);

    private final BookingRepository repository;
    private final RoomUnitRepository roomUnitRepository;
    private final PaymentRepository paymentRepository;
    private final EmailNotificationService emailNotificationService;

    public List<BookingResponse> findAllVisible(User actor, BookingStatus status) {
        User authUser = requireAuthenticatedUser(actor);

        List<Booking> bookings;

        if (authUser.getRole() == Role.CLIENT) {
            bookings = status == null
                    ? repository.findByUser_IdOrderByCreatedAtDesc(authUser.getId())
                    : repository.findByUser_IdAndStatusOrderByCreatedAtDesc(authUser.getId(), status);
        } else if (authUser.getRole() == Role.ESTABLISHMENT_ADMIN) {
            bookings = status == null
                    ? repository.findByEstablishment_User_IdOrderByCreatedAtDesc(authUser.getId())
                    : repository.findByEstablishment_User_IdAndStatusOrderByCreatedAtDesc(authUser.getId(), status);
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only clients and establishment admin s can view bookings");
        }

        return bookings.stream().map(BookingMapper::toResponse).toList();
    }

    public List<BookingResponse> findHistory(User actor) {
        return findAllVisible(actor, null);
    }

    public BookingResponse findById(User actor, Long id) {
        User authUser = requireAuthenticatedUser(actor);
        Booking booking = requireBooking(id);

        validateCanAccessBooking(authUser, booking);
        return BookingMapper.toResponse(booking);
    }

    public Booking findEntityById(Long id) {
        return repository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found (id: " + id + ")"));
    }

    @Transactional
    public BookingResponse create(User actor, BookingCreateRequest dto) {
        User authUser = requireAuthenticatedUser(actor);

        validateDateRange(dto.checkInDate(), dto.checkOutDate());

        RoomUnit roomUnit = requireBookableRoomUnit(dto.roomUnitId());
        validateAvailability(roomUnit.getId(), dto.checkInDate(), dto.checkOutDate(), null);

        long nights = ChronoUnit.DAYS.between(dto.checkInDate(), dto.checkOutDate());
        BigDecimal totalAmount = calculateTotalAmount(roomUnit.getType().getPricePerNight(), nights);

        int advancePaymentPercentage = resolveAdvancePaymentPercentage(roomUnit);
        BigDecimal advancePaymentAmount = calculateAdvancePaymentAmount(totalAmount, advancePaymentPercentage);

        Booking booking = Booking.builder()
                .user(authUser)
                .establishment(roomUnit.getType().getEstablishment())
                .roomUnit(roomUnit)
                .checkInDate(dto.checkInDate())
                .checkOutDate(dto.checkOutDate())
                .status(BookingStatus.PENDING)
                .advancePaymentPercentage(advancePaymentPercentage)
                .advancePaymentAmount(advancePaymentAmount)
                .totalAmount(totalAmount)
                .build();

        Booking saved = repository.save(booking);
        emailNotificationService.sendBookingCreatedToClient(saved);
        emailNotificationService.sendBookingCreatedToEstablishmentAdmin(saved);
        return BookingMapper.toResponse(saved);
    }

    @Transactional
    public BookingResponse cancel(User actor, Long id) {
        User authUser = requireAuthenticatedUser(actor);
        Booking booking = requireBooking(id);

        validateCanAccessBooking(authUser, booking);

        if (booking.getStatus() == BookingStatus.CANCELED) {
            return BookingMapper.toResponse(booking);
        }

        booking.setStatus(BookingStatus.CANCELED);
        booking.setCanceledAt(LocalDateTime.now());

        return BookingMapper.toResponse(booking);
    }

    @Transactional
    public BookingResponse confirm(User actor, Long id) {
        User authUser = requireAuthenticatedUser(actor);
        Booking booking = requireBooking(id);

        validateCanConfirmBooking(authUser, booking);

        if (booking.getStatus() == BookingStatus.CANCELED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Canceled bookings cannot be confirmed");
        }

        if (booking.getStatus() == BookingStatus.ADVANCE_CONFIRMED) {
            return BookingMapper.toResponse(booking);
        }

        booking.setStatus(BookingStatus.ADVANCE_CONFIRMED);
        return BookingMapper.toResponse(booking);
    }

    @Transactional
    public BookingResponse reschedule(User actor, Long id, BookingRescheduleRequest dto) {
        User authUser = requireAuthenticatedUser(actor);
        Booking booking = requireBooking(id);

        validateCanAccessBooking(authUser, booking);

        if (booking.getStatus() == BookingStatus.CANCELED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Canceled bookings cannot be rescheduled");
        }

        validateDateRange(dto.checkInDate(), dto.checkOutDate());

        long currentNights = ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate());
        long requestedNights = ChronoUnit.DAYS.between(dto.checkInDate(), dto.checkOutDate());
        boolean hasPayments = hasAnyPayments(booking.getId());
        boolean canChangeNights = booking.getStatus() == BookingStatus.PENDING && !hasPayments;

        if (!canChangeNights && requestedNights != currentNights) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bookings with payments or confirmed reservations must keep the same number of nights. Please cancel this booking and create a new one if you need a different stay length.");
        }

        validateAvailability(booking.getRoomUnit().getId(), dto.checkInDate(), dto.checkOutDate(), booking.getId());

        BigDecimal totalAmount = calculateTotalAmount(booking.getRoomUnit().getType().getPricePerNight(),
                requestedNights);
        BigDecimal advancePaymentAmount = calculateAdvancePaymentAmount(totalAmount,
                booking.getAdvancePaymentPercentage());

        booking.setCheckInDate(dto.checkInDate());
        booking.setCheckOutDate(dto.checkOutDate());
        booking.setTotalAmount(totalAmount);
        booking.setAdvancePaymentAmount(advancePaymentAmount);

        if (booking.getStatus() == BookingStatus.ADVANCE_CONFIRMED) {
            booking.setStatus(BookingStatus.PENDING);
        }

        return BookingMapper.toResponse(booking);
    }

    private User requireAuthenticatedUser(User actor) {
        if (actor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }

        return actor;
    }

    private Booking requireBooking(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    private RoomUnit requireBookableRoomUnit(Long roomUnitId) {
        RoomUnit roomUnit = roomUnitRepository.findByIdAndIsActiveTrue(roomUnitId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Room unit not found or is inactive"));

        if (!roomUnit.getType().isActive() || !roomUnit.getType().getEstablishment().isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Room unit belongs to an inactive room type or establishment");
        }

        if (roomUnit.getStatus() == RoomUnitStatus.MAINTENANCE || roomUnit.getStatus() == RoomUnitStatus.OUT_OF_ORDER) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Room unit is not available for booking");
        }

        return roomUnit;
    }

    private void validateDateRange(LocalDate checkInDate, LocalDate checkOutDate) {
        if (!checkInDate.isBefore(checkOutDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "checkInDate must be earlier than checkOutDate");
        }

        if (checkInDate.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "checkInDate cannot be in the past");
        }
    }

    private void validateAvailability(Long roomUnitId, LocalDate checkInDate, LocalDate checkOutDate, Long bookingId) {
        boolean hasOverlap = bookingId == null
                ? repository.existsByRoomUnit_IdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                        roomUnitId,
                        BLOCKING_STATUSES,
                        checkOutDate,
                        checkInDate)
                : repository.existsByRoomUnit_IdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThanAndIdNot(
                        roomUnitId,
                        BLOCKING_STATUSES,
                        checkOutDate,
                        checkInDate,
                        bookingId);

        if (hasOverlap) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Room unit is not available for the selected date range");
        }
    }

    private BigDecimal calculateTotalAmount(BigDecimal pricePerNight, long nights) {
        if (nights <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Reservation must include at least one night");
        }

        return pricePerNight.multiply(BigDecimal.valueOf(nights)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateAdvancePaymentAmount(BigDecimal totalAmount, int advancePaymentPercentage) {
        return totalAmount.multiply(BigDecimal.valueOf(advancePaymentPercentage))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private int resolveAdvancePaymentPercentage(RoomUnit roomUnit) {
        boolean requiresAdvancePayment = Boolean.TRUE.equals(roomUnit.getType().getRequiresAdvancePayment());

        if (!requiresAdvancePayment) {
            return 0;
        }

        Integer configuredPercentage = roomUnit.getType().getAdvancePaymentPercentage();

        if (configuredPercentage == null || configuredPercentage < 1 || configuredPercentage > 100) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Room type advance payment percentage is not configured correctly");
        }

        return configuredPercentage;
    }

    private boolean hasAnyPayments(Long bookingId) {
        return !paymentRepository.findByBooking_Id(bookingId).isEmpty();
    }

    private void validateCanAccessBooking(User actor, Booking booking) {
        if (actor.getRole() == Role.CLIENT && booking.getUser().getId().equals(actor.getId())) {
            return;
        }

        if (actor.getRole() == Role.ESTABLISHMENT_ADMIN &&
                booking.getEstablishment().getUser().getId().equals(actor.getId())) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "You do not have access to this booking");
    }

    private void validateCanConfirmBooking(User actor, Booking booking) {
        if (actor.getRole() == Role.ESTABLISHMENT_ADMIN &&
                booking.getEstablishment().getUser().getId().equals(actor.getId())) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Only establishment admin s can confirm bookings");
    }
}
