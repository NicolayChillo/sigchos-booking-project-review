package com.sigchos.booking.modules.auth.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sigchos.booking.modules.auth.dto.ForgotPasswordRequest;
import com.sigchos.booking.modules.auth.dto.RegisterRequest;
import com.sigchos.booking.modules.auth.service.PasswordRecoveryService;
import com.sigchos.booking.modules.role.model.Role;
import com.sigchos.booking.modules.user.dto.UserResponse;
import com.sigchos.booking.modules.user.service.UserService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private PasswordRecoveryService passwordRecoveryService;

    @Test
    @DisplayName("POST /auth/register - Debe registrar usuario exitosamente (200 OK)")
    void shouldRegisterUserSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Juan");
        request.setLastName("Perez");
        request.setEmail("juan.perez@test.com");
        request.setPassword("Password123!");
        request.setPhone("0999999999");
        request.setBirthDate(LocalDate.of(1990, 1, 1));

        UserResponse response = new UserResponse(
                1L, "Juan", "Perez", "juan.perez@test.com", "0999999999", null,
                LocalDate.of(1990, 1, 1), Role.CLIENT, true, true, false, true);

        when(userService.registerClient(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.email").value("juan.perez@test.com"))
                .andExpect(jsonPath("$.role").value("CLIENT"));
    }

    @Test
    @DisplayName("POST /auth/register - Falla si faltan campos (400 Bad Request)")
    void shouldFailRegisterWhenFieldsAreMissing() throws Exception {
        RegisterRequest request = new RegisterRequest();
        // email is missing
        request.setFirstName("Juan");
        request.setLastName("Perez");

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /auth/forgot-password - Debe enviar peticion de recuperacion (204 No Content)")
    void shouldRequestPasswordReset() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@domain.com");

        doNothing().when(passwordRecoveryService).requestPasswordReset(anyString());

        mockMvc.perform(post("/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());
    }
}
