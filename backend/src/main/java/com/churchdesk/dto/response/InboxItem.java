package com.churchdesk.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import com.churchdesk.enums.IssueStatus;

/** One issue waiting in (or finished by) a department. */
public record InboxItem(Long issueId, Long caseId, String code, String category, String description, IssueStatus status,
                        String departmentName, Instant referredAt, LocalDate returnOn, List<String> complainants,
                        List<String> subjects, String churchName, Instant resolvedAt, String resolvedBy, String resolutionNote,
                        String priority, LocalDate dueOn, long daysLate, int escalationLevel, int queuePosition, String subCity) {}
