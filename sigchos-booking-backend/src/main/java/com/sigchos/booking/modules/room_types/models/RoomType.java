package com.sigchos.booking.modules.room_types.models;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

import com.sigchos.booking.modules.establishments.model.Establishment;
import com.sigchos.booking.modules.room_type_images.models.RoomTypeImage;
import com.sigchos.booking.modules.room_types.enums.RoomAmenity;
import com.sigchos.booking.modules.room_types.enums.RoomBedType;
import com.sigchos.booking.modules.room_types.enums.RoomCategory;
import com.sigchos.booking.modules.room_units.model.RoomUnit;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "room_types")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class RoomType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "establishment_id", nullable = false)
    private Establishment establishment;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RoomCategory category;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "bed_count")
    private Integer bedCount;

    @Column(name = "bed_type", length = 30)
    @Enumerated(EnumType.STRING)
    private RoomBedType bedType;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "room_type_amenities", joinColumns = @JoinColumn(name = "room_type_id"))
    @Column(name = "amenity", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<RoomAmenity> amenities = new HashSet<>();

    @Column(nullable = false, name = "price_per_night", precision = 10, scale = 2)
    private BigDecimal pricePerNight;

    @Column(name = "requires_advance_payment")
    @Builder.Default
    private Boolean requiresAdvancePayment = false;

    @Column(name = "advance_payment_percentage")
    @Builder.Default
    private Integer advancePaymentPercentage = 0;

    @Column(nullable = false, name = "is_active")
    @Builder.Default
    private boolean isActive = true;

    @OneToMany(mappedBy = "type", fetch = FetchType.LAZY)
    private Set<RoomUnit> units;

    @OneToMany(mappedBy = "roomType", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<RoomTypeImage> images;
}
