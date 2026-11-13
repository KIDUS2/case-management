package com.churchdesk.dto.response;

import org.springframework.web.bind.annotation.*;
import java.util.List;

public record PersonCase(Long caseId, String code, String role, String status, java.time.Instant createdAt, boolean hasCourt, List<CaseIssueLine> issues) {}
