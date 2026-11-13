package com.churchdesk.dto.response;

import java.time.Instant;
import java.util.*;
import com.churchdesk.enums.CaseStatus;

public record LeaderRow(Long caseId, String code, String leader, String roleInCase, String churchName, String subCity, CaseStatus status,
                        List<String> categories, int issueCount, int resolvedCount, Instant createdAt) {}
