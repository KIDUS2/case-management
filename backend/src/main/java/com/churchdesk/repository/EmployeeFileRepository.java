package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.churchdesk.model.EmployeeFile;

public interface EmployeeFileRepository extends JpaRepository<EmployeeFile, Long> {
    List<EmployeeFile> findByPersonIdOrderByUploadedAtDesc(Long personId);
    long countByPersonId(Long personId);
}
