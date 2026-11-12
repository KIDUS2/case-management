package com.churchdesk.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmployeeEducationRepository extends JpaRepository<EmployeeEducation, Long> {
    List<EmployeeEducation> findByPersonIdOrderByKindAscEndYearDescStartYearDesc(Long personId);
}
