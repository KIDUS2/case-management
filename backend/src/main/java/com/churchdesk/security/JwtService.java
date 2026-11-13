package com.churchdesk.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import com.churchdesk.model.AppUser;

@Service
public class JwtService {
    private final SecretKey key;
    private final long ttlMs;

    public JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.ttl-minutes}") long ttlMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttlMs = ttlMinutes * 60_000;
    }

    public String create(AppUser u) {
        long now = System.currentTimeMillis();
        return Jwts.builder().subject(u.getUsername()).claim("role", u.getRole().name())
                .issuedAt(new Date(now)).expiration(new Date(now + ttlMs)).signWith(key).compact();
    }

    public Claims parse(String token) { return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload(); }
}
