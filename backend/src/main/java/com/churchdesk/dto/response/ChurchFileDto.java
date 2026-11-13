package com.churchdesk.dto.response;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;

public record ChurchFileDto(Long id, String kind, String title, String originalName, String contentType, long sizeBytes, String uploadedBy, Instant uploadedAt) {}
