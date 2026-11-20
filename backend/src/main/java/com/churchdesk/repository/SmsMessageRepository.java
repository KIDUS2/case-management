package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.churchdesk.model.SmsMessage;

public interface SmsMessageRepository extends JpaRepository<SmsMessage, Long> {
    List<SmsMessage> findByCaseIdOrderByIdDesc(Long caseId);
}
