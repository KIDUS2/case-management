package com.churchdesk.dto.response;

import org.springframework.web.bind.annotation.*;

public record FacilityDto(Long id, String kind, String name, Integer capacity, String condition, String notes) {}
