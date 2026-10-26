package com.sigchos.booking.modules.auth.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class LegacyUserFlagsBackfill implements CommandLineRunner {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        entityManager.createNativeQuery("""
                update users
                set profile_completed = coalesce(profile_completed, true),
                    must_change_password = coalesce(must_change_password, false)
                where profile_completed is null
                   or must_change_password is null
                """).executeUpdate();
    }
}