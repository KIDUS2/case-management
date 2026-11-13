package com.churchdesk.dto.response;

import java.util.*;
import com.churchdesk.dto.common.DayCount;
import com.churchdesk.dto.common.NameCount;

public record SummaryResult(long cases, long issues, long issuesResolved, long letters, long withOpenInquiry, long lateIssues, long urgentIssues, boolean truncated,
                     List<SummarySubCityRow> subCities, List<Escalated> escalations, List<LeaderRow> leaders,
                     Map<String, Long> byStatus, Map<String, Long> byCategory, List<NameCount> byDepartment, List<NameCount> byChurch, List<DayCount> daily,
                     List<SummaryRow> rows, long total, int page, int size, List<InquiryDto> waitingForAdmin) {}
