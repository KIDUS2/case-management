package com.churchdesk.user;

import com.churchdesk.security.JwtService;
import com.churchdesk.user.Dtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(UserRepository repo, PasswordEncoder encoder, JwtService jwt) { this.repo = repo; this.encoder = encoder; this.jwt = jwt; }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest r) {
        AppUser u = repo.findByUsername(r.username().trim().toLowerCase())
                .filter(AppUser::isActive)
                .filter(x -> encoder.matches(r.password(), x.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong username or password"));
        return new LoginResponse(jwt.create(u), UserDto.of(u));
    }

    @GetMapping("/me")
    public UserDto me(Authentication auth) {
        return repo.findByUsername(auth.getName()).map(UserDto::of)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
}
