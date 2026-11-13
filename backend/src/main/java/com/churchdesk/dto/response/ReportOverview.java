package com.churchdesk.dto.response;

import java.util.List;
import java.util.Map;
import com.churchdesk.dto.common.DayCount;
import com.churchdesk.dto.common.NameCount;

public record ReportOverview(ReportTotals totals, Flow flow, List<DeptCount> byDepartment, Map<String, Long> byStatus, Map<String, Long> byCategory,
                       List<NameCount> topChurches, List<DayCount> daily, List<Hotspot> bySubCity, List<Hotspot> churchesByIssues) {}
