package com.churchdesk.dto.response;

import org.springframework.web.bind.annotation.*;

public record CaseIssueLine(String category, String status, boolean court) {}
