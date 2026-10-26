package com.sigchos.booking.modules.establishment_images.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sigchos.booking.modules.establishment_images.model.EstablishmentImage;

public interface EstablishmentImageRepository extends JpaRepository<EstablishmentImage, Long> {
    List<EstablishmentImage> findByEstablishment_Id(Long id);
}