package com.churchdesk.dto.response;

import java.time.Instant;
import com.churchdesk.enums.EventType;

public record EventDto(Long id, Long issueId, EventType type, String message, String actor, Instant createdAt) {}
