package com.churchdesk.dto.response;

import java.time.Instant;

public record InvestigationDto(Long id, Long caseId, String caseCode, Long issueId, String instruction, String team,
                               String assignedTo, String assignedToName, String status, String requestedBy, Instant requestedAt,
                               String report, String reportedBy, Instant reportedAt) {}
