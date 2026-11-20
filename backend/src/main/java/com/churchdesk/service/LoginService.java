package com.churchdesk.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import com.churchdesk.model.AppUser;
import com.churchdesk.repository.UserRepository;

/** Checks the password. After 5 wrong tries the account is locked for 15 minutes, and every sign-in is recorded. */
@Service
public class LoginService {
    static final int MAX_TRIES = 5;
    static final Duration LOCK = Duration.ofMinutes(15);

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final AuditService audit;

    public LoginService(UserRepository repo, PasswordEncoder encoder, AuditService audit) {
        this.repo = repo; this.encoder = encoder; this.audit = audit;
    }

    // the counter must be saved even though we then throw the "wrong password" error
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public AppUser authenticate(String rawUsername, String password) {
        String name = rawUsername.trim().toLowerCase();
        Optional<AppUser> found = repo.findByUsername(name).filter(AppUser::isActive);
        if (found.isEmpty()) {
            audit.record(name, "LOGIN_FAILED", "USER", name, "Unknown or inactive account");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong username or password");
        }
        AppUser u = found.get();
        if (u.getLockedUntil() != null && u.getLockedUntil().isAfter(Instant.now())) {
            long mins = Math.max(1, Duration.between(Instant.now(), u.getLockedUntil()).toMinutes() + 1);
            audit.record(name, "LOGIN_BLOCKED", "USER", name, "Account locked");
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many wrong passwords. Please try again in " + mins + " minutes, or ask the administrator.");
        }
        if (!encoder.matches(password, u.getPasswordHash())) {
            int tries = u.getFailedAttempts() + 1;
            u.setFailedAttempts(tries);
            if (tries >= MAX_TRIES) { u.setLockedUntil(Instant.now().plus(LOCK)); u.setFailedAttempts(0); }
            audit.record(name, "LOGIN_FAILED", "USER", name, tries >= MAX_TRIES ? "Wrong password. Account locked for 15 minutes" : "Wrong password (" + tries + ")");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong username or password");
        }
        u.setFailedAttempts(0);
        u.setLockedUntil(null);
        audit.record(name, "LOGIN", "USER", name, null);
        return u;
    }
}
