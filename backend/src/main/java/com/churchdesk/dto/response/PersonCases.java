package com.churchdesk.dto.response;

import org.springframework.web.bind.annotation.*;
import java.util.List;

public record PersonCases(List<PersonCase> cases, int hidden) {}
