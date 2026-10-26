package com.sigchos.booking.modules.auth.security;

import java.io.IOException;
import java.time.LocalDateTime;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException {

        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // Creamos el JSON manualmente para que coincida con tu ErrorResponse
        String json = String.format(
                "{\"timestamp\": \"%s\", \"status\": %d, \"error\": \"Unauthorized\", \"message\": \"%s\", \"path\": \"%s\"}",
                LocalDateTime.now(),
                HttpServletResponse.SC_UNAUTHORIZED,
                "Unauthorized: Token missing or invalid",
                request.getRequestURI());

        response.getWriter().write(json);
    }
}