package com.churchdesk.user;

import com.churchdesk.department.Department;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "app_user")
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private String username;
    @Column(name = "full_name", nullable = false) private String fullName;
    @Column(name = "password_hash", nullable = false) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Role role;
    @Column(nullable = false) private boolean active = true;
    private String phone;
    private String email;
    @Column(name = "job_title") private String jobTitle;
    @Column(name = "can_view_all", nullable = false) private boolean canViewAll;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "department_id") private Department department;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String v) { username = v; }
    public String getFullName() { return fullName; }
    public void setFullName(String v) { fullName = v; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String v) { passwordHash = v; }
    public Role getRole() { return role; }
    public void setRole(Role v) { role = v; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department v) { department = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { phone = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { email = v; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String v) { jobTitle = v; }
    public boolean isCanViewAll() { return canViewAll; }
    public void setCanViewAll(boolean v) { canViewAll = v; }
    public boolean isActive() { return active; }
    public void setActive(boolean v) { active = v; }
}
