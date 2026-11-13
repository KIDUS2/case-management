package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import com.churchdesk.model.CaseGrant;

public interface CaseGrantRepository extends JpaRepository<CaseGrant, Long> {
    boolean existsByCaseIdAndUserId(Long caseId, Long userId);
    Optional<CaseGrant> findByCaseIdAndUserId(Long caseId, Long userId);
    List<CaseGrant> findByCaseIdOrderByGrantedAtAsc(Long caseId);
}
