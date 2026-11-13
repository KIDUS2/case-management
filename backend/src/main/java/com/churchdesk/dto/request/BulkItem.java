package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

public record BulkItem(@NotBlank @Size(max = 160) String name, @Size(max = 80) String subCity) {}
