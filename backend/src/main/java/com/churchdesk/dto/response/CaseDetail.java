package com.churchdesk.dto.response;

import java.time.Instant;
import java.util.List;
import com.churchdesk.enums.CaseStatus;
import com.churchdesk.enums.CaseKind;
import com.churchdesk.enums.ReviewStatus;

public record CaseDetail(Long id, String code, CaseStatus status, String discussionNotes, boolean letterIssued,
                         String createdBy, Instant createdAt, List<PersonInfo> complainants, List<PersonInfo> subjects, List<PersonInfo> involved,
                         List<IssueDto> issues, List<CaseSummary> relatedCases, List<Long> linkedCaseIds, List<EventDto> events, List<CaseFileDto> files,
                         ReviewStatus reviewStatus, String reviewNote, String reviewedBy,
                         CaseKind kind, boolean subCitySolved) {}
