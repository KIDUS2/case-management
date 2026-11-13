package com.churchdesk.dto.request;

import jakarta.validation.constraints.Size;

public record NoteRequest(@Size(max = 4000) String note) {}
