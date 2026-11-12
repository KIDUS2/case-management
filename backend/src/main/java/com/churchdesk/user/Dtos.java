package com.churchdesk.user;

import jakarta.validation.constraints.*;

public final class Dtos {
    private Dtos() {}
    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
    public record UserDto(Long id, String username, String fullName, Role role, boolean active, Long departmentId, String departmentName) {
        public static UserDto of(AppUser u) {
            return new UserDto(u.getId(), u.getUsername(), u.getFullName(), u.getRole(), u.isActive(),
                    u.getDepartment() == null ? null : u.getDepartment().getId(),
                    u.getDepartment() == null ? null : u.getDepartment().getName());
        }
    }
    public record LoginResponse(String token, UserDto user) {}
    public record CreateUserRequest(@NotBlank @Size(min = 3, max = 60) String username,
                                    @NotBlank @Size(max = 120) String fullName,
                                    @NotBlank @Size(min = 6, max = 72) String password,
                                    @NotNull Role role,
                                    Long departmentId) {}
    /** Every field optional: only the ones sent are changed. */
    public record UpdateUserRequest(@Size(max = 120) String fullName, Role role, Boolean active,
                                    @Size(min = 6, max = 72) String password, Long departmentId) {}
    public record ChangePasswordRequest(@NotBlank String currentPassword, @NotBlank @Size(min = 6, max = 72) String newPassword) {}
}
