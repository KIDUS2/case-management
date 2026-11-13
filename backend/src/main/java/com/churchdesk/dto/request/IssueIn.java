package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** departmentId/returnOn are optional: the desk can send an issue to a department right at registration. */
public record IssueIn(@NotBlank @Size(max = 40) String category, @Size(max = 4000) String description, Long departmentId, LocalDate returnOn) {}
