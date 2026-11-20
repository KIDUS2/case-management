package com.churchdesk.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

/**
 * Sends the message to an SMS provider over HTTP (for example the Ethio Telecom SMS gateway). The address, login and
 * body shape come from application.properties, so the provider can be changed without touching code:
 * <pre>
 * app.sms.mode=http
 * app.sms.url=https://...
 * app.sms.username=...  app.sms.password=...  app.sms.sender=ChurchDesk
 * app.sms.body-template={"to":"{to}","from":"{from}","message":"{message}"}
 * </pre>
 * {to}, {from} and {message} are filled in (and JSON-escaped) for every message.
 */
@Component
@ConditionalOnProperty(name = "app.sms.mode", havingValue = "http")
public class HttpSmsGateway implements SmsGateway {
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final String url, username, password, sender, template, contentType;

    public HttpSmsGateway(@Value("${app.sms.url:}") String url,
                          @Value("${app.sms.username:}") String username,
                          @Value("${app.sms.password:}") String password,
                          @Value("${app.sms.sender:ChurchDesk}") String sender,
                          @Value("${app.sms.body-template:}") String template,
                          @Value("${app.sms.content-type:application/json}") String contentType) {
        this.url = url; this.username = username; this.password = password;
        this.sender = sender;
        this.template = template == null || template.isBlank() ? "{\"to\":\"{to}\",\"from\":\"{from}\",\"message\":\"{message}\"}" : template; this.contentType = contentType;
    }

    @Override public String mode() { return "http"; }

    @Override public void send(String phone, String text) throws Exception {
        if (url == null || url.isBlank()) throw new IllegalStateException("app.sms.url is not set");
        String body = template.replace("{to}", esc(phone)).replace("{from}", esc(sender)).replace("{message}", esc(text));
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(10))
                .header("Content-Type", contentType).POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8));
        if (username != null && !username.isBlank())
            b.header("Authorization", "Basic " + Base64.getEncoder().encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8)));
        HttpResponse<String> res = client.send(b.build(), HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() / 100 != 2) throw new IllegalStateException("SMS provider answered " + res.statusCode());
    }

    private static String esc(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
