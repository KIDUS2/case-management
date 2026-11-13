package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

public record GrantRequest(@NotNull Long userId) {}
