package com.churchdesk.dto.response;

import java.time.Instant;
import java.util.List;
import com.churchdesk.enums.CaseStatus;

public record CaseDetail(Long id, String code, CaseStatus status, String discussionNotes, boolean letterIssued,
                         String createdBy, Instant createdAt, List<PersonInfo> complainants, List<PersonInfo> subjects, List<PersonInfo> involved,
                         List<IssueDto> issues, List<CaseSummary> relatedCases, List<Long> linkedCaseIds, List<EventDto> events, List<CaseFileDto> files) {}
