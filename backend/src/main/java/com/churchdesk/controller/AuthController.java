package com.churchdesk.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.churchdesk.dto.request.AccountProfileRequest;
import com.churchdesk.dto.request.ChangePasswordRequest;
import com.churchdesk.dto.request.LoginRequest;
import com.churchdesk.dto.response.LoginResponse;
import com.churchdesk.dto.response.UserDto;
import com.churchdesk.model.AppUser;
import com.churchdesk.repository.UserRepository;
import com.churchdesk.security.CurrentUser;
import com.churchdesk.security.JwtService;
import com.churchdesk.service.UserService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final CurrentUser current;
    private final UserService service;

    public AuthController(UserRepository repo, PasswordEncoder encoder, JwtService jwt, CurrentUser current, UserService service) {
        this.repo = repo; this.encoder = encoder; this.jwt = jwt; this.current = current; this.service = service;
    }

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

    @PutMapping("/profile")
    public UserDto profile(@Valid @RequestBody AccountProfileRequest r, Authentication auth) {
        return service.updateProfile(current.get(auth), r);
    }

    @PostMapping("/password") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest r, Authentication auth) {
        service.changePassword(current.get(auth), r);
    }
}
