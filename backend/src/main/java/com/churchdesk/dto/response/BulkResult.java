package com.churchdesk.dto.response;

import org.springframework.web.bind.annotation.*;

public record BulkResult(int added, int skipped, int updated) {}
