package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

public record AskRequest(Long issueId, @NotBlank @Size(max = 4000) String question) {}
