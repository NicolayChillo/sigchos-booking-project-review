package com.sigchos.booking.modules.notifications.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.notifications.brevo")
public class BrevoProperties {

    private boolean enabled = true;
    private String senderEmail;
    private String senderName = "Sigchos booking";
    private String overrideToEmail;
}
