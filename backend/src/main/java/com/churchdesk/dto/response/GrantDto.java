package com.churchdesk.dto.response;

import org.springframework.web.bind.annotation.*;
import java.time.Instant;

public record GrantDto(Long userId, String fullName, String username, String role, String grantedBy, Instant grantedAt) {}
