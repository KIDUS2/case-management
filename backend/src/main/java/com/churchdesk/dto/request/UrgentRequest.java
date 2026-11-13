package com.churchdesk.dto.request;

import org.springframework.web.bind.annotation.*;

public record UrgentRequest(boolean urgent) {}
