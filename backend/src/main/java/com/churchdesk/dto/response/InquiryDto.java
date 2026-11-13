package com.churchdesk.dto.response;

import java.time.Instant;
import java.util.List;

public record InquiryDto(Long id, Long caseId, String caseCode, Long issueId, String issueLabel, Long departmentId, String departmentName,
                         String churchName, String status, String question, String askedBy, Instant askedAt,
                         String finding, String findingBy, Instant findingAt,
                         String decision, Boolean churchAgreed, String decidedBy, Instant decidedAt,
                         List<CaseFileDto> requestFiles, List<CaseFileDto> findingFiles) {}
