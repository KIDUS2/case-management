package com.churchdesk.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import com.churchdesk.enums.IssueStatus;

public record IssueDto(Long id, String category, String description, IssueStatus status,
                       Long departmentId, String departmentName, Instant referredAt, LocalDate returnOn,
                       String resolutionNote, String resolvedBy, Instant resolvedAt,
                       Instant courtAt, String courtAckBy, Instant courtAckAt,
                       String priority, LocalDate dueOn, long daysLate, int escalationLevel, int queuePosition) {}
