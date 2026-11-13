package com.churchdesk.dto.response;

import java.time.Instant;
import java.util.*;
import com.churchdesk.enums.CaseStatus;

public record SummaryRow(Long id, String code, List<String> complainants, List<String> subjects, String churchName, String subCity, CaseStatus status,
                  int issueCount, int resolvedCount, List<String> categories, List<String> departments, int openInquiries,
                  boolean letterIssued, Instant createdAt) {}
