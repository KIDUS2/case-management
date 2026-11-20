package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CaseLookupRequest(@NotBlank @Size(max = 12) String code, @NotBlank @Size(max = 30) String phone) {}
