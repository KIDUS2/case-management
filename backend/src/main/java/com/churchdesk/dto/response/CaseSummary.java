package com.churchdesk.dto.response;

import java.time.Instant;
import java.util.List;
import com.churchdesk.enums.CaseStatus;

public record CaseSummary(Long id, String code, List<String> complainants, List<String> subjects, String churchName,
                          CaseStatus status, int issueCount, int resolvedCount, List<String> categories,
                          boolean letterIssued, Instant createdAt) {}
