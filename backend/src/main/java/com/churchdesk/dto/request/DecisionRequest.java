package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

public record DecisionRequest(@NotBlank @Size(max = 6000) String decision, boolean churchAgreed) {}
