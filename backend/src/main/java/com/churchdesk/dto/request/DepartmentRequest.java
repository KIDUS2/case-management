package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

public record DepartmentRequest(@NotBlank @Size(max = 120) String name, String handlesCategory, Boolean active) {}
