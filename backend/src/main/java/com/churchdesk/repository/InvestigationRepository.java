package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.churchdesk.model.Investigation;

public interface InvestigationRepository extends JpaRepository<Investigation, Long> {
    List<Investigation> findByCaseIdOrderByIdDesc(Long caseId);
    List<Investigation> findByAssignedToAndStatusOrderByIdDesc(String assignedTo, String status);
    List<Investigation> findByStatusOrderByIdDesc(String status);
}
