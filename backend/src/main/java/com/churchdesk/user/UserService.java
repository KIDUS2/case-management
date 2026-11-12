package com.churchdesk.user;

import com.churchdesk.user.Dtos.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class UserService {
    private final UserRepository repo;
    private final PasswordEncoder encoder;

    public UserService(UserRepository repo, PasswordEncoder encoder) { this.repo = repo; this.encoder = encoder; }

    public List<UserDto> list() { return repo.findAll().stream().map(UserDto::of).toList(); }

    @Transactional
    public UserDto create(CreateUserRequest r) {
        String username = r.username().trim().toLowerCase();
        if (repo.existsByUsername(username)) throw new ResponseStatusException(HttpStatus.CONFLICT, "That username is already taken");
        AppUser u = new AppUser();
        u.setUsername(username);
        u.setFullName(r.fullName().trim());
        u.setPasswordHash(encoder.encode(r.password()));
        u.setRole(r.role());
        return UserDto.of(repo.save(u));
    }

    @Transactional
    public UserDto update(Long id, UpdateUserRequest r, String actingUsername) {
        AppUser u = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        boolean self = u.getUsername().equals(actingUsername);
        if (self && ((r.active() != null && !r.active()) || (r.role() != null && r.role() != Role.ADMIN)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can’t deactivate or demote your own account");
        if (r.fullName() != null && !r.fullName().isBlank()) u.setFullName(r.fullName().trim());
        if (r.role() != null) u.setRole(r.role());
        if (r.active() != null) u.setActive(r.active());
        if (r.password() != null) u.setPasswordHash(encoder.encode(r.password()));
        return UserDto.of(u);
    }
}
