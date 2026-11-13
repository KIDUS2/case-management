package com.churchdesk.dto.request;

import jakarta.validation.constraints.*;
import com.churchdesk.enums.Role;

public record CreateUserRequest(@NotBlank @Size(min = 3, max = 60) String username,
                                @NotBlank @Size(max = 120) String fullName,
                                @NotBlank @Size(min = 6, max = 72) String password,
                                @NotNull Role role,
                                Long departmentId,
                                @Size(max = 40) String phone, @Size(max = 120) String email, @Size(max = 120) String jobTitle,
                                Boolean canViewAll) {}
