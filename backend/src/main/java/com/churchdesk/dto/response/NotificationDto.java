package com.churchdesk.dto.response;

import java.time.Instant;

public record NotificationDto(Long id, String type, String title, String body, Long caseId, String caseCode, Instant createdAt, boolean read) {}
