package com.churchdesk.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/** Sends plain-text emails. In "log" mode (the default) nothing leaves the server; the email is only written to the log. */
@Component
public class EmailSender {
    private static final Logger log = LoggerFactory.getLogger(EmailSender.class);

    private final ObjectProvider<JavaMailSender> mail;
    private final String configuredMode;
    private final String from;
    private final String username;

    public EmailSender(ObjectProvider<JavaMailSender> mail, @Value("${app.mail.mode:log}") String mode,
                       @Value("${app.mail.from:}") String from, @Value("${spring.mail.username:}") String username) {
        this.mail = mail; this.configuredMode = mode; this.from = from; this.username = username;
    }

    /** "smtp" when a mail server is set up, otherwise "log". */
    public String mode() { return "smtp".equalsIgnoreCase(configuredMode) && mail.getIfAvailable() != null ? "smtp" : "log"; }

    public void send(String to, String subject, String text) throws Exception {
        if (!"smtp".equals(mode())) { log.info("Email (not sent, log mode) to {}: {} / {}", to, subject, text); return; }
        SimpleMailMessage m = new SimpleMailMessage();
        String sender = !from.isBlank() ? from : username;
        if (!sender.isBlank()) m.setFrom(sender);
        m.setTo(to); m.setSubject(subject); m.setText(text);
        mail.getObject().send(m);
    }
}
