package com.churchdesk.dto.response;

import org.springframework.web.bind.annotation.*;
import java.util.List;

public record ImportResult(int created, int updated, List<String> errors, int missingPhone) {}
