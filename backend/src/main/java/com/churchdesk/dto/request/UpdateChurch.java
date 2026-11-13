package com.churchdesk.dto.request;

import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

public record UpdateChurch(@Size(max = 80) String subCity) {}
