package com.churchdesk.dto.request;

import jakarta.validation.constraints.*;

public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
