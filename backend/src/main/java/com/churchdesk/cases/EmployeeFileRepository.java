package com.churchdesk.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmployeeFileRepository extends JpaRepository<EmployeeFile, Long> {
    List<EmployeeFile> findByPersonIdOrderByUploadedAtDesc(Long personId);
    long countByPersonId(Long personId);
}
