package com.churchdesk.dto.response;

import java.time.Instant;

public record CaseFileDto(Long id, Long issueId, Long inquiryId, String stage, String originalName, String contentType, long size, String uploadedBy, Instant uploadedAt) {}
