package com.churchdesk.dto.response;

import java.time.Instant;

public record AuditDto(Long id, Instant at, String username, String action, String entity, String entityId, String detail, String ip) {}
