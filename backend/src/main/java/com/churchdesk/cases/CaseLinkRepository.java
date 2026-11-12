package com.churchdesk.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CaseLinkRepository extends JpaRepository<CaseLink, Long> {
    List<CaseLink> findByCaseIdOrLinkedCaseId(Long caseId, Long linkedCaseId);
    boolean existsByCaseIdAndLinkedCaseId(Long caseId, Long linkedCaseId);
}
