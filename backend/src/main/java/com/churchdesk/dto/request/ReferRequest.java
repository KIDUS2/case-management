package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ReferRequest(@NotNull Long departmentId, LocalDate returnOn, @Size(max = 2000) String note) {}
