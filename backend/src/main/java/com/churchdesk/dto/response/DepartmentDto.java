package com.churchdesk.dto.response;

import org.springframework.web.bind.annotation.*;

public record DepartmentDto(Long id, String name, String handlesCategory, boolean active, long staff) {}
