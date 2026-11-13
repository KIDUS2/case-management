package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

public record PostingRequest(@NotBlank @Size(max = 200) String place, @Size(max = 160) String position, LocalDate startDate, LocalDate endDate, @Size(max = 1000) String notes) {}
