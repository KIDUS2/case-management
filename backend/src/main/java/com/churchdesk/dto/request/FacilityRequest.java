package com.churchdesk.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

public record FacilityRequest(@NotBlank String kind, @Size(max = 120) String name, @Min(0) @Max(1000000) Integer capacity,
                              String condition, @Size(max = 500) String notes) {}
