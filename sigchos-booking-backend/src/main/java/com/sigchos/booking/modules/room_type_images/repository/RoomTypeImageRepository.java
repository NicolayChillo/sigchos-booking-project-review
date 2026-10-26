package com.sigchos.booking.modules.room_type_images.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sigchos.booking.modules.room_type_images.models.RoomTypeImage;

public interface RoomTypeImageRepository extends JpaRepository<RoomTypeImage, Long> {
    List<RoomTypeImage> findByRoomType_Id(Long id);
}