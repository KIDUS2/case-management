package com.churchdesk.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.churchdesk.dto.request.CreateUserRequest;
import com.churchdesk.dto.request.UpdateUserRequest;
import com.churchdesk.dto.response.UserDto;
import com.churchdesk.service.UserService;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
    private final UserService service;
    public UserController(UserService service) { this.service = service; }

    @GetMapping public List<UserDto> list() { return service.list(); }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public UserDto create(@Valid @RequestBody CreateUserRequest r) { return service.create(r); }

    @PutMapping("/{id}")
    public UserDto update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest r, Authentication auth) {
        return service.update(id, r, auth.getName());
    }
}
