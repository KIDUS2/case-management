package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** One piece of writing: a report, a solution, a reason. */
public record TextRequest(@NotBlank @Size(max = 8000) String text) {}
