package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import com.churchdesk.model.ChurchInquiry;

public interface ChurchInquiryRepository extends JpaRepository<ChurchInquiry, Long> {
    List<ChurchInquiry> findByCaseIdOrderByAskedAtDesc(Long caseId);
    List<ChurchInquiry> findByStatusOrderByFindingAtAsc(String status);
    List<ChurchInquiry> findByStatusInOrderByAskedAtDesc(Collection<String> statuses);
}
