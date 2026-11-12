package com.churchdesk.cases;

import com.churchdesk.user.CurrentUser;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api")
public class SummaryController {
    private final SummaryService service;
    private final CurrentUser current;
    public SummaryController(SummaryService service, CurrentUser current) { this.service = service; this.current = current; }

    @GetMapping("/summary")
    public SummaryService.Result summary(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                         @RequestParam(required = false) CaseStatus status,
                                         @RequestParam(required = false) Long departmentId,
                                         @RequestParam(required = false) String q,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "25") int size, Authentication auth) {
        return service.build(from, to, status, departmentId, q, page, size, current.get(auth));
    }
}
