package com.churchdesk.dto.request;

import jakarta.validation.constraints.Size;

/** The decision on a case a sub-city submitted. A note is required when the case is returned. */
public record ReviewRequest(boolean accept, @Size(max = 1000) String note) {}
