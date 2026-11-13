package com.churchdesk.dto.response;

import jakarta.validation.constraints.*;
import com.churchdesk.enums.Role;
import com.churchdesk.model.AppUser;

public record UserDto(Long id, String username, String fullName, Role role, boolean active, Long departmentId, String departmentName,
                      String phone, String email, String jobTitle, boolean canViewAll) {
    public static UserDto of(AppUser u) {
        return new UserDto(u.getId(), u.getUsername(), u.getFullName(), u.getRole(), u.isActive(),
                u.getDepartment() == null ? null : u.getDepartment().getId(),
                u.getDepartment() == null ? null : u.getDepartment().getName(),
                u.getPhone(), u.getEmail(), u.getJobTitle(), u.isCanViewAll());
    }
}
