package com.churchdesk.dto.response;

import java.time.LocalDate;
import java.util.List;

/** What a person may see about their own case without signing in: progress only, never names or notes. */
public record PublicCaseStatus(String code, String status, int issues, int resolved, LocalDate appointmentDate, Integer appointmentSpot,
                               List<IssueLine> lines, boolean awaitingReview) {
    public record IssueLine(String category, String status) {}
}
