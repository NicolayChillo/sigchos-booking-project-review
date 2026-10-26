package com.sigchos.booking.modules.user.repository;

import com.sigchos.booking.modules.user.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRuc(String ruc);

    Optional<User> findByRuc(String ruc);

    Optional<User> findByIdAndActiveTrue(Long id);
}
