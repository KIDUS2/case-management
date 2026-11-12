package com.churchdesk.user;

import jakarta.validation.constraints.*;

public final class Dtos {
    private Dtos() {}
    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
    public record UserDto(Long id, String username, String fullName, Role role, boolean active) {
        public static UserDto of(AppUser u) { return new UserDto(u.getId(), u.getUsername(), u.getFullName(), u.getRole(), u.isActive()); }
    }
    public record LoginResponse(String token, UserDto user) {}
    public record CreateUserRequest(@NotBlank @Size(min = 3, max = 60) String username,
                                    @NotBlank @Size(max = 120) String fullName,
                                    @NotBlank @Size(min = 6, max = 72) String password,
                                    @NotNull Role role) {}
    /** Every field optional: only the ones sent are changed. */
    public record UpdateUserRequest(@Size(max = 120) String fullName, Role role, Boolean active,
                                    @Size(min = 6, max = 72) String password) {}
}
