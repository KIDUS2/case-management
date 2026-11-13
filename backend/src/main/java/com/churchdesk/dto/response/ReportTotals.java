package com.churchdesk.dto.response;

public record ReportTotals(long cases, long people, long returningPeople, long churches, long letters,
                     long churchMembers, long reportedOn, long repeatReportedOn) {}
