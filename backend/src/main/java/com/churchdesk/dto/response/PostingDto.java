package com.churchdesk.dto.response;

import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

public record PostingDto(Long id, String place, String position, LocalDate startDate, LocalDate endDate, String notes) {}
