package com.churchdesk.dto.response;

import org.springframework.web.bind.annotation.*;

public record EducationDto(Long id, String kind, String level, String field, String institution, Integer startYear, Integer endYear, boolean completed, String notes) {}
