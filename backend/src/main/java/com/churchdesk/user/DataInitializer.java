package com.churchdesk.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Creates the first admin on an empty database so someone can log in. */
@Component
public class DataInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final UserRepository repo;
    private final PasswordEncoder encoder;
    @Value("${app.admin.username}") private String username;
    @Value("${app.admin.password}") private String password;

    public DataInitializer(UserRepository repo, PasswordEncoder encoder) { this.repo = repo; this.encoder = encoder; }

    @Override public void run(String... args) {
        if (repo.count() > 0) return;
        AppUser u = new AppUser();
        u.setUsername(username); u.setFullName("System Administrator");
        u.setPasswordHash(encoder.encode(password)); u.setRole(Role.ADMIN);
        repo.save(u);
        log.warn("Created first admin '{}'. Change its password after logging in.", username);
    }
}
