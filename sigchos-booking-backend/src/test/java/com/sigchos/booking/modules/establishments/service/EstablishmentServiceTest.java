package com.sigchos.booking.modules.establishments.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.modules.establishment_images.service.EstablishmentImageService;
import com.sigchos.booking.modules.establishment_services.repository.EstablishmentServicesRepository;
import com.sigchos.booking.modules.establishments.dto.EstablishmentResponse;
import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.establishments.repository.EstablishmentRepository;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.modules.establishments.dto.EstablishmentRequest;
import com.sigchos.booking.modules.establishments.dto.EstablishmentUpdateRequest;
import com.sigchos.booking.modules.role.model.Role;

@ExtendWith(MockitoExtension.class)
public class EstablishmentServiceTest {

    @Mock
    private EstablishmentRepository establishmentRepository;

    @Mock
    private EstablishmentImageService establishmentImageService;

    @Mock
    private EstablishmentServicesRepository establishmentServicesRepository;

    private EstablishmentService establishmentService;

    @BeforeEach
    void setUp() {
        establishmentService = new EstablishmentService(
                establishmentRepository,
                establishmentImageService,
                establishmentServicesRepository);
    }

    @Test
    void getPublicEstablishments_ShouldReturnList() {
        User user = new User();
        user.setId(10L);
        Establishment est = new Establishment();
        est.setId(1L);
        est.setName("Hotel Sol");
        est.setActive(true);
        est.setUser(user);

        when(establishmentRepository.findAllPublicWithActiveRoomInventory()).thenReturn(List.of(est));

        List<EstablishmentResponse> result = establishmentService.findAllPublic();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Hotel Sol", result.get(0).name());
    }

    @Test
    void findEntityById_ShouldReturnEstablishment() {
        Establishment est = new Establishment();
        est.setId(1L);
        est.setName("Hotel Luna");
        
        when(establishmentRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(est));

        Establishment result = establishmentService.findActive(1L);
        assertNotNull(result);
        assertEquals("Hotel Luna", result.getName());
    }

    @Test
    void findEntityById_ShouldThrowNotFound() {
        when(establishmentRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> establishmentService.findActive(1L));
    }

    @Test
    void findAll_ShouldReturnEstablishmentsForUser() {
        User user = new User();
        user.setId(1L);
        user.setRole(Role.ESTABLISHMENT_ADMIN);
        Establishment est = new Establishment();
        est.setId(1L);
        est.setUser(user);
        when(establishmentRepository.findByUser_Id(1L)).thenReturn(List.of(est));
        
        List<EstablishmentResponse> res = establishmentService.findAll(user);
        assertEquals(1, res.size());
    }

    @Test
    void create_ShouldCreateEstablishment() {
        User user = new User();
        user.setId(1L);
        user.setRole(Role.ESTABLISHMENT_ADMIN);
        user.setActive(true);
        
        EstablishmentRequest req = EstablishmentRequest.builder()
            .name("New Hotel")
            .description("Desc")
            .address("Addr")
            .checkInTime("14:00")
            .checkOutTime("12:00")
            .advancePaymentPolicy("Policy")
            .cancellationPolicy("Policy")
            .cancelPenaltyAfterEnabled(false)
            .childrenPolicy("Policy")
            .ageRestrictionPolicy("Policy")
            .petsPolicy("Policy")
            .build();
            
        when(establishmentRepository.existsByNameIgnoreCaseAndUser_Id("New Hotel", 1L)).thenReturn(false);
        Establishment est = new Establishment();
        est.setId(1L);
        est.setName("New Hotel");
        est.setUser(user);
        when(establishmentRepository.save(any())).thenReturn(est);
        
        EstablishmentResponse res = establishmentService.create(user, req);
        assertNotNull(res);
        assertEquals("New Hotel", res.name());
    }

    @Test
    void update_ShouldUpdateEstablishment() {
        User user = new User();
        user.setId(1L);
        user.setRole(Role.ESTABLISHMENT_ADMIN);
        Establishment est = new Establishment();
        est.setId(1L);
        est.setUser(user);
        est.setImages(new java.util.HashSet<>());
        
        EstablishmentUpdateRequest req = new EstablishmentUpdateRequest(
            "Updated Hotel", "Desc", "Addr", "14:00", "12:00", "Pol", "Pol", null, false, null, "Pol", "Pol", "Pol",
            null, null, null, null, null, null, null, null, null, null, null, null);
            
        when(establishmentRepository.findById(1L)).thenReturn(Optional.of(est));
        lenient().when(establishmentRepository.existsByNameIgnoreCaseAndIdNotAndUser_Id("Updated Hotel", 1L, 1L)).thenReturn(false);
        lenient().when(establishmentRepository.save(any())).thenReturn(est);
        
        EstablishmentResponse res = establishmentService.update(user, 1L, req);
        assertNotNull(res);
    }

    @Test
    void delete_ShouldDeactivateEstablishment() {
        User user = new User();
        user.setId(1L);
        user.setRole(Role.ESTABLISHMENT_ADMIN);
        Establishment est = new Establishment();
        est.setId(1L);
        est.setUser(user);
        est.setActive(true);
        
        when(establishmentRepository.findById(1L)).thenReturn(Optional.of(est));
        
        establishmentService.delete(user, 1L);
        assertFalse(est.isActive());
    }

    @Test
    void restore_ShouldActivateEstablishment() {
        User user = new User();
        user.setId(1L);
        user.setRole(Role.ESTABLISHMENT_ADMIN);
        Establishment est = new Establishment();
        est.setId(1L);
        est.setUser(user);
        est.setActive(false);
        
        when(establishmentRepository.findById(1L)).thenReturn(Optional.of(est));
        
        establishmentService.restore(user, 1L);
        assertTrue(est.isActive());
    }
}
