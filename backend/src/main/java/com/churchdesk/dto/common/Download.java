package com.churchdesk.dto.common;

import org.springframework.core.io.Resource;

public record Download(Resource resource, String name, String contentType) {}
