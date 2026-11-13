package com.churchdesk.dto.request;

import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

public record OptionRequest(@Size(max = 120) String label, @Size(max = 120) String labelAm, @Size(max = 16) String icon, Boolean active) {}
