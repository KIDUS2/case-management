package com.churchdesk.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import com.churchdesk.dto.request.AccountProfileRequest;
import com.churchdesk.dto.request.ChangePasswordRequest;
import com.churchdesk.dto.request.CreateUserRequest;
import com.churchdesk.dto.request.UpdateUserRequest;
import com.churchdesk.dto.response.UserDto;
import com.churchdesk.enums.Role;
import com.churchdesk.model.AppUser;
import com.churchdesk.model.Department;
import com.churchdesk.repository.DepartmentRepository;
import com.churchdesk.repository.UserRepository;

@Service
public class UserService {
    private final UserRepository repo;
    private final DepartmentRepository departments;
    private final PasswordEncoder encoder;

    public UserService(UserRepository repo, DepartmentRepository departments, PasswordEncoder encoder) {
        this.repo = repo; this.departments = departments; this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<UserDto> list() { return repo.findAll().stream().map(UserDto::of).toList(); }

    @Transactional
    public UserDto create(CreateUserRequest r) {
        String username = r.username().trim().toLowerCase();
        if (repo.existsByUsername(username)) throw new ResponseStatusException(HttpStatus.CONFLICT, "That username is already taken");
        AppUser u = new AppUser();
        u.setUsername(username);
        u.setFullName(r.fullName().trim());
        u.setPasswordHash(encoder.encode(r.password()));
        u.setRole(r.role());
        u.setDepartment(departmentFor(r.role(), r.departmentId()));
        u.setPhone(blank(r.phone())); u.setEmail(blank(r.email())); u.setJobTitle(blank(r.jobTitle()));
        u.setCanViewAll(Boolean.TRUE.equals(r.canViewAll()));
        return UserDto.of(repo.save(u));
    }

    @Transactional
    public UserDto update(Long id, UpdateUserRequest r, String actingUsername) {
        AppUser u = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        boolean self = u.getUsername().equals(actingUsername);
        if (self && ((r.active() != null && !r.active()) || (r.role() != null && r.role() != Role.ADMIN)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can’t deactivate or demote your own account");
        if (r.fullName() != null && !r.fullName().isBlank()) u.setFullName(r.fullName().trim());
        Role role = r.role() != null ? r.role() : u.getRole();
        Long deptId = r.departmentId() != null ? r.departmentId() : (u.getDepartment() == null ? null : u.getDepartment().getId());
        u.setRole(role);
        u.setDepartment(departmentFor(role, deptId));
        if (r.active() != null) u.setActive(r.active());
        if (r.phone() != null) u.setPhone(blank(r.phone()));
        if (r.email() != null) u.setEmail(blank(r.email()));
        if (r.jobTitle() != null) u.setJobTitle(blank(r.jobTitle()));
        if (r.canViewAll() != null) u.setCanViewAll(r.canViewAll());
        if (r.password() != null) u.setPasswordHash(encoder.encode(r.password()));
        return UserDto.of(u);
    }

    @Transactional
    public UserDto updateProfile(AppUser who, AccountProfileRequest r) {
        AppUser u = repo.findById(who.getId()).orElseThrow();
        u.setFullName(r.fullName().trim());
        u.setPhone(blank(r.phone())); u.setEmail(blank(r.email())); u.setJobTitle(blank(r.jobTitle()));
        return UserDto.of(u);
    }

    private static String blank(String s) { return s == null || s.isBlank() ? null : s.trim(); }

    @Transactional
    public void changePassword(AppUser who, ChangePasswordRequest r) {
        AppUser u = repo.findById(who.getId()).orElseThrow();
        if (!encoder.matches(r.currentPassword(), u.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your current password is not correct");
        u.setPasswordHash(encoder.encode(r.newPassword()));
    }

    /** Only department staff belong to a department, and they must belong to one. */
    private Department departmentFor(Role role, Long departmentId) {
        if (role != Role.DEPARTMENT) return null;
        if (departmentId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose the department this person works in");
        return departments.findById(departmentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));
    }
}
