package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.churchdesk.model.CaseEvent;

public interface CaseEventRepository extends JpaRepository<CaseEvent, Long> {
    List<CaseEvent> findByCaseIdOrderByCreatedAtDescIdDesc(Long caseId);
}
