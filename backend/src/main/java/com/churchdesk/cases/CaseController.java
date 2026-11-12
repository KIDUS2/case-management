package com.churchdesk.cases;

import com.churchdesk.cases.CaseDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class CaseController {
    private final CaseService service;
    public CaseController(CaseService service) { this.service = service; }

    @GetMapping("/cases")
    public PageDto<CaseSummary> list(@RequestParam(required = false) String q,
                                     @RequestParam(required = false) CaseStatus status,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "12") int size) {
        return service.list(q, status, page, size);
    }

    @GetMapping("/cases/summary")
    public Summary summary() { return service.summary(); }

    @GetMapping("/cases/code/{code}")
    public CaseDetail byCode(@PathVariable String code) { return service.getByCode(code); }

    @GetMapping("/cases/{id}")
    public CaseDetail get(@PathVariable Long id) { return service.get(id); }

    @PostMapping("/cases") @ResponseStatus(HttpStatus.CREATED)
    public CaseDetail create(@Valid @RequestBody CreateCaseRequest r, Authentication auth) {
        return service.create(r, auth.getName());
    }

    @GetMapping("/persons/lookup")
    public List<PersonInfo> lookup(@RequestParam String name) { return service.lookup(name); }
}
