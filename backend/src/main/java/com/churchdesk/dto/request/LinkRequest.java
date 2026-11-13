package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LinkRequest(@jakarta.validation.constraints.NotBlank String code) {}
