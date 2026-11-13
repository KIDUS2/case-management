package com.churchdesk.dto.request;

import jakarta.validation.constraints.*;

/** What a person can change about themselves. */
public record AccountProfileRequest(@NotBlank @Size(max = 120) String fullName, @Size(max = 40) String phone,
                             @Size(max = 120) String email, @Size(max = 120) String jobTitle) {}
