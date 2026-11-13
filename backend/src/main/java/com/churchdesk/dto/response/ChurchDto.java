package com.churchdesk.dto.response;

import org.springframework.web.bind.annotation.*;

public record ChurchDto(Long id, String name, String subCity, boolean located) {}
