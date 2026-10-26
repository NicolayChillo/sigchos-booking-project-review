package com.sigchos.booking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configuración de ejecución asíncrona para el envío de notificaciones por correo.
 * Los métodos anotados con @Async("emailTaskExecutor") se ejecutan en este pool
 * dedicado, liberando inmediatamente el hilo del request HTTP.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Pool de hilos dedicado para el envío de correos.
     * - corePoolSize(2): mantiene 2 hilos siempre vivos para responder rápido.
     * - maxPoolSize(5): puede escalar hasta 5 hilos si hay picos de envío.
     * - queueCapacity(50): cola de hasta 50 correos pendientes antes de escalar.
     * - threadNamePrefix: facilita identificar estos hilos en logs.
     */
    @Bean(name = "emailTaskExecutor")
    public Executor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("email-");
        executor.initialize();
        return executor;
    }
}
