package com.churchdesk.dto.request;

import jakarta.validation.constraints.*;
import com.churchdesk.enums.Role;

/** Every field optional: only the ones sent are changed. */
public record UpdateUserRequest(@Size(max = 120) String fullName, Role role, Boolean active,
                                @Size(min = 6, max = 72) String password, Long departmentId,
                                @Size(max = 40) String phone, @Size(max = 120) String email, @Size(max = 120) String jobTitle,
                                Boolean canViewAll) {}
