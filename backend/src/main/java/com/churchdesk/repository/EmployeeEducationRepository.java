package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.churchdesk.model.EmployeeEducation;

public interface EmployeeEducationRepository extends JpaRepository<EmployeeEducation, Long> {
    List<EmployeeEducation> findByPersonIdOrderByKindAscEndYearDescStartYearDesc(Long personId);
}
