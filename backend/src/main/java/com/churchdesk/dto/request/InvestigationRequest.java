package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InvestigationRequest(Long issueId, @NotBlank @Size(max = 4000) String instruction,
                                   @Size(max = 500) String team, @Size(max = 100) String assignedTo) {}
