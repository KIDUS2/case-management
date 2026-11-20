package com.churchdesk.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.churchdesk.dto.common.PageDto;
import com.churchdesk.dto.response.AuditDto;
import com.churchdesk.service.AuditService;

/** The administrator can see who signed in, who opened which case and who downloaded which file. */
@RestController
@RequestMapping("/api/audit")
public class AuditController {
    private final AuditService audit;
    public AuditController(AuditService audit) { this.audit = audit; }

    @GetMapping @PreAuthorize("hasRole('ADMIN')")
    public PageDto<AuditDto> search(@RequestParam(defaultValue = "") String q, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return audit.search(q, page, size);
    }
}
