package com.churchdesk.dto.request;

import jakarta.validation.constraints.Size;

public record HoldRequest(boolean hold, @Size(max = 500) String reason) {}
