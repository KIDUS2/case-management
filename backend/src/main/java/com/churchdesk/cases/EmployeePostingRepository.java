package com.churchdesk.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EmployeePostingRepository extends JpaRepository<EmployeePosting, Long> {
    List<EmployeePosting> findByPersonIdOrderByStartDateDescIdDesc(Long personId);
    Optional<EmployeePosting> findFirstByPersonIdAndEndDateIsNullOrderByStartDateDescIdDesc(Long personId);
}
