package com.churchdesk.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Default: nothing leaves the server, the message is only written to the log. Good for testing. */
@Component
@ConditionalOnProperty(name = "app.sms.mode", havingValue = "log", matchIfMissing = true)
public class LogSmsGateway implements SmsGateway {
    private static final Logger log = LoggerFactory.getLogger(LogSmsGateway.class);

    @Override public String mode() { return "log"; }

    @Override public void send(String phone, String text) {
        log.info("SMS (not sent, log mode) to {}: {}", phone, text);
    }
}
