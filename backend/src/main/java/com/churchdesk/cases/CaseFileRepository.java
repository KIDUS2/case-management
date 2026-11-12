package com.churchdesk.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CaseFileRepository extends JpaRepository<CaseFile, Long> {
    List<CaseFile> findByCaseIdOrderByUploadedAtDesc(Long caseId);
}
