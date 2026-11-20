package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubcityReferralRequest(Long issueId, @NotBlank @Size(max = 80) String subCity,
                                     @NotBlank @Size(max = 4000) String instruction) {}
