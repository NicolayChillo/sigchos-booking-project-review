package com.sigchos.booking.modules.room_types.services;

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

import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.establishments.service.EstablishmentService;
import com.sigchos.booking.modules.room_type_images.service.RoomTypeImageService;
import com.sigchos.booking.modules.room_types.dto.RoomTypeRequest;
import com.sigchos.booking.modules.room_types.dto.RoomTypeResponse;
import com.sigchos.booking.modules.room_types.enums.RoomBedType;
import com.sigchos.booking.modules.room_types.enums.RoomCategory;
import com.sigchos.booking.modules.room_types.models.RoomType;
import com.sigchos.booking.modules.room_types.repository.RoomTypeRepository;
import com.sigchos.booking.modules.room_units.repository.RoomUnitRepository;
import com.sigchos.booking.modules.user.model.User;
import com.sigchos.booking.enums.StatusFilter;
import com.sigchos.booking.modules.role.model.Role;
import java.util.Set;
import java.math.BigDecimal;

@ExtendWith(MockitoExtension.class)
public class RoomTypeServiceTest {

    @Mock
    private RoomTypeRepository roomTypeRepository;

    @Mock
    private EstablishmentService establishmentService;

    @Mock
    private RoomUnitRepository roomUnitRepository;

    @Mock
    private RoomTypeImageService roomTypeImageService;

    private RoomTypeService roomTypeService;

    @BeforeEach
    void setUp() {
        roomTypeService = new RoomTypeService(
                roomTypeRepository,
                establishmentService,
                roomUnitRepository,
                roomTypeImageService);
    }

    @Test
    void findEntityById_ShouldReturnRoomType() {
        RoomType rt = new RoomType();
        rt.setId(1L);
        rt.setName("Suite Presidencial");

        when(roomTypeRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(rt));

        RoomType result = roomTypeService.findActive(1L);

        assertNotNull(result);
        assertEquals("Suite Presidencial", result.getName());
    }

    @Test
    void findEntityById_ShouldThrowNotFound() {
        when(roomTypeRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> roomTypeService.findActive(1L));
    }

    @Test
    void findByEstablishmentId_ShouldReturnRoomTypes() {
        Establishment est = new Establishment();
        est.setId(1L);
        RoomType rt = new RoomType();
        rt.setId(1L);
        rt.setEstablishment(est);
        when(roomTypeRepository.findByEstablishment_Id(1L)).thenReturn(List.of(rt));
        
        List<RoomTypeResponse> res = roomTypeService.findByEstablishmentId(1L, StatusFilter.ALL);
        assertEquals(1, res.size());
    }

    @Test
    void create_ShouldCreateRoomType() {
        User user = new User();
        user.setId(1L);
        user.setRole(Role.ESTABLISHMENT_ADMIN);
        Establishment est = new Establishment();
        est.setId(1L);
        est.setUser(user);

        RoomTypeRequest req = new RoomTypeRequest("Suite", "Desc", RoomCategory.HOTEL_ROOM, 2, 1, RoomBedType.DOUBLE, new java.util.HashSet<>(), new BigDecimal("100.00"), false, null, null);
        
        when(establishmentService.findActive(1L)).thenReturn(est);
        
        RoomType rt = new RoomType();
        rt.setId(1L);
        rt.setName("Suite");
        rt.setEstablishment(est);
        
        when(roomTypeRepository.save(any())).thenReturn(rt);
        
        RoomTypeResponse res = roomTypeService.create(user, 1L, req);
        assertNotNull(res);
        assertEquals("Suite", res.name());
    }

    @Test
    void delete_ShouldDeactivateRoomType() {
        User user = new User();
        user.setId(1L);
        user.setRole(Role.ESTABLISHMENT_ADMIN);
        Establishment est = new Establishment();
        est.setId(1L);
        est.setUser(user);
        
        RoomType rt = new RoomType();
        rt.setId(1L);
        rt.setEstablishment(est);
        rt.setActive(true);
        
        when(roomTypeRepository.findById(1L)).thenReturn(Optional.of(rt));
        
        roomTypeService.delete(user, 1L);
        assertFalse(rt.isActive());
    }
}
