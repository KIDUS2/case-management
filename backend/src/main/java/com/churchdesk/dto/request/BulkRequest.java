package com.churchdesk.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;
import java.util.List;

public record BulkRequest(@Size(max = 2000) List<String> names, @Size(max = 2000) List<@jakarta.validation.Valid BulkItem> items) {}
