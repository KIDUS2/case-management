package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.churchdesk.model.CaseFile;

public interface CaseFileRepository extends JpaRepository<CaseFile, Long> {
    List<CaseFile> findByCaseIdOrderByUploadedAtDesc(Long caseId);
}
