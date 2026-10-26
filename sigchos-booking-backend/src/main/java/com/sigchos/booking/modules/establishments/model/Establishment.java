package com.sigchos.booking.modules.establishments.model;

import java.util.Set;

import com.sigchos.booking.modules.establishment_images.model.EstablishmentImage;
import com.sigchos.booking.modules.establishment_services.model.EstablishmentServices;
import com.sigchos.booking.modules.room_types.models.RoomType;
import com.sigchos.booking.modules.user.model.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "establishments")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Establishment {
    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(name = "check_in_time", length = 5)
    private String checkInTime;

    @Column(name = "check_out_time", length = 5)
    private String checkOutTime;

    @Column(name = "advance_payment_policy", length = 500)
    private String advancePaymentPolicy;

    @Column(name = "cancellation_policy", length = 500)
    private String cancellationPolicy;

    @Column(name = "cancel_penalty_window_hours")
    private Integer cancelPenaltyWindowHours;

    @Column(name = "cancel_penalty_after_enabled", nullable = false)
    @Builder.Default
    private boolean cancelPenaltyAfterEnabled = false;

    @Column(name = "cancel_penalty_after_percentage")
    private Integer cancelPenaltyAfterPercentage;

    @Column(name = "children_policy", length = 500)
    private String childrenPolicy;

    @Column(name = "age_restriction_policy", length = 255)
    private String ageRestrictionPolicy;

    @Column(name = "pets_policy", length = 500)
    private String petsPolicy;

    @Column(name = "other_policies", columnDefinition = "TEXT")
    private String otherPolicies;

    @Column(length = 50)
    private String parish;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "payphone_token", length = 500)
    private String payphoneToken;

    @Column(name = "payphone_store_id", length = 100)
    private String payphoneStoreId;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_account_type", length = 30)
    private String bankAccountType;

    @Column(name = "bank_account_number", length = 30)
    private String bankAccountNumber;

    @Column(name = "bank_account_owner_name", length = 150)
    private String bankAccountOwnerName;

    @Column(name = "bank_account_owner_id", length = 20)
    private String bankAccountOwnerId;

    @OneToMany(mappedBy = "establishment", fetch = FetchType.LAZY)
    private Set<EstablishmentServices> services;

    @OneToMany(mappedBy = "establishment", fetch = FetchType.LAZY)
    private Set<RoomType> roomTypes;

    @OneToMany(mappedBy = "establishment", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<EstablishmentImage> images;

    public boolean hasGatewayAvailable() {
        return payphoneToken != null && !payphoneToken.isBlank() && payphoneStoreId != null
                && !payphoneStoreId.isBlank();
    }
}
