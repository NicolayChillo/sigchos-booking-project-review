package com.sigchos.booking.modules.bookings.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sigchos.booking.modules.bookings.dto.BookingCreateRequest;
import com.sigchos.booking.modules.bookings.dto.BookingResponse;
import com.sigchos.booking.modules.bookings.enums.BookingStatus;
import com.sigchos.booking.modules.bookings.service.BookingService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private BookingService bookingService;

    @Test
    @DisplayName("GET /bookings - Usuario CLIENT debe ver sus reservas (200 OK)")
    void shouldReturnVisibleBookingsForClient() throws Exception {
        com.sigchos.booking.modules.user.model.User client = new com.sigchos.booking.modules.user.model.User();
        client.setEmail("client@test.com");
        client.setRole(com.sigchos.booking.modules.role.model.Role.CLIENT);

        BookingResponse response = new BookingResponse(
                1L, 100L, 200L, 300L, "Suite", 400L, "101",
                LocalDate.now(), LocalDate.now().plusDays(2), 2L,
                BookingStatus.PENDING, 50, new BigDecimal("25.00"), new BigDecimal("50.00"),
                "Ninguna", 24, false, null, null, null, null, true, null, null, null, null, null);

        when(bookingService.findAllVisible(any(), any())).thenReturn(List.of(response));

        mockMvc.perform(get("/bookings")
                .with(user(client))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /bookings - Usuario no autenticado debe recibir 401 (Unauthorized)")
    void shouldReturn401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/bookings")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /bookings - Usuario CLIENT puede crear reserva (201 Created)")
    void shouldCreateBookingForClient() throws Exception {
        com.sigchos.booking.modules.user.model.User client = new com.sigchos.booking.modules.user.model.User();
        client.setEmail("client@test.com");
        client.setRole(com.sigchos.booking.modules.role.model.Role.CLIENT);

        BookingCreateRequest request = new BookingCreateRequest(
                400L, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3));

        BookingResponse response = new BookingResponse(
                1L, 100L, 200L, 300L, "Suite", 400L, "101",
                request.checkInDate(), request.checkOutDate(), 2L,
                BookingStatus.PENDING, 50, new BigDecimal("25.00"), new BigDecimal("50.00"),
                "Ninguna", 24, false, null, null, null, null, true, null, null, null, null, null);

        when(bookingService.create(any(), any())).thenReturn(response);

        mockMvc.perform(post("/bookings")
                .with(user(client))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.roomUnitId").value(400L));
    }

    @Test
    @DisplayName("POST /bookings - ADMIN de Establecimiento NO puede crear reserva como cliente (403 Forbidden)")
    void shouldReturn403WhenAdminTriesToCreateBooking() throws Exception {
        com.sigchos.booking.modules.user.model.User admin = new com.sigchos.booking.modules.user.model.User();
        admin.setEmail("admin@hotel.com");
        admin.setRole(com.sigchos.booking.modules.role.model.Role.ESTABLISHMENT_ADMIN);

        BookingCreateRequest request = new BookingCreateRequest(
                400L, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3));

        mockMvc.perform(post("/bookings")
                .with(user(admin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /bookings - Payload invalido (falta habitacion) debe dar 400 Bad Request")
    void shouldReturn400WhenPayloadIsInvalid() throws Exception {
        com.sigchos.booking.modules.user.model.User client = new com.sigchos.booking.modules.user.model.User();
        client.setEmail("client@test.com");
        client.setRole(com.sigchos.booking.modules.role.model.Role.CLIENT);

        // ID nulo
        BookingCreateRequest request = new BookingCreateRequest(
                null, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3));

        mockMvc.perform(post("/bookings")
                .with(user(client))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
