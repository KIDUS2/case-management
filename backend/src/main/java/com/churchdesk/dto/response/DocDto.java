package com.churchdesk.dto.response;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;

public record DocDto(Long id, String title, String kind, String originalName, String contentType, long sizeBytes, String uploadedBy, Instant uploadedAt) {}
