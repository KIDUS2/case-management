package com.churchdesk.dto.response;

import java.time.Instant;

public record SubcityReferralDto(Long id, Long caseId, String caseCode, Long issueId, String subCity, String instruction,
                                 String status, String sentBy, Instant sentAt, String solution, String repliedBy, Instant repliedAt) {}
