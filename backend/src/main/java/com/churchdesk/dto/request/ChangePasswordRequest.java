package com.churchdesk.dto.request;

import jakarta.validation.constraints.*;

public record ChangePasswordRequest(@NotBlank String currentPassword, @NotBlank @Size(min = 6, max = 72) String newPassword) {}
