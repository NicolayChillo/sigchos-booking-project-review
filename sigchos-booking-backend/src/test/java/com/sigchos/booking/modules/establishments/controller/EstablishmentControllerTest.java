package com.sigchos.booking.modules.establishments.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

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

import com.sigchos.booking.modules.establishments.dto.EstablishmentResponse;
import com.sigchos.booking.modules.establishments.service.EstablishmentService;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.modules.role.model.Role;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class EstablishmentControllerTest {

    @Autowired
    private MockMvc mockMvc;


    @MockitoBean
    private EstablishmentService establishmentService;

    private User createMockAdminUser() {
        User u = new User();
        u.setId(1L);
        u.setEmail("admin@test.com");
        u.setRole(Role.ESTABLISHMENT_ADMIN);
        u.setActive(true);
        return u;
    }

    private User createMockClientUser() {
        User u = new User();
        u.setId(2L);
        u.setEmail("client@test.com");
        u.setRole(Role.CLIENT);
        u.setActive(true);
        return u;
    }

    private EstablishmentResponse createMockResponse(Long id, String name) {
        return new EstablishmentResponse(
                id, 1L, name, "Description", "Address", "14:00", "12:00",
                null, null, null, false, null, null, null, null, List.of(),
                "Parish", -0.1, -78.1, true, null, null, false, null, null, null, null, null, List.of());
    }


    @Test
    @DisplayName("GET /establishments - Debería fallar para CLIENT, permitirse para ADMIN")
    void getEstablishments_ShouldCheckRoles() throws Exception {
        // Fallar para cliente
        mockMvc.perform(get("/establishments")
                .with(user(createMockClientUser()))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        // Permitir para ADMIN
        EstablishmentResponse estAdmin = createMockResponse(2L, "Hosteria Admin");
        
        when(establishmentService.findAll(any(User.class))).thenReturn(List.of(estAdmin));

        mockMvc.perform(get("/establishments")
                .with(user(createMockAdminUser()))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].name").value("Hosteria Admin"));
    }
}
