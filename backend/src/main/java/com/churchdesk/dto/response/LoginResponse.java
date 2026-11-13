package com.churchdesk.dto.response;

import jakarta.validation.constraints.*;

public record LoginResponse(String token, UserDto user) {}
