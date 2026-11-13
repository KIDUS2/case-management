package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import com.churchdesk.enums.Role;
import com.churchdesk.model.AppUser;

public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
    boolean existsByUsername(String username);
    List<AppUser> findByRoleAndActiveTrue(Role role);
    List<AppUser> findByDepartmentIdAndActiveTrue(Long departmentId);
    long countByDepartmentId(Long departmentId);
}
