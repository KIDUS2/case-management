package com.churchdesk.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import com.churchdesk.model.AppUser;
import com.churchdesk.repository.UserRepository;

/** Looks up the signed-in account (with its role and department) for the current request. */
@Component
public class CurrentUser {
    private final UserRepository users;
    public CurrentUser(UserRepository users) { this.users = users; }

    public AppUser get(Authentication auth) {
        return users.findByUsername(auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
}
