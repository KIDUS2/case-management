package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

public record EducationRequest(@NotBlank @Pattern(regexp = "SPIRITUAL|SECULAR") String kind, @Size(max = 120) String level, @Size(max = 160) String field,
                               @Size(max = 200) String institution, Integer startYear, Integer endYear, Boolean completed, @Size(max = 1000) String notes) {}
