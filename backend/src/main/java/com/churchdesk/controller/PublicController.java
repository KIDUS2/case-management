package com.churchdesk.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import com.churchdesk.dto.request.CaseLookupRequest;
import com.churchdesk.dto.response.PublicCaseStatus;
import com.churchdesk.service.PublicStatusService;

/** Open to everyone (no sign-in): the person who brought a case checks how it is going. */
@RestController
@RequestMapping("/api/public")
public class PublicController {
    private final PublicStatusService status;
    public PublicController(PublicStatusService status) { this.status = status; }

    @PostMapping("/case-status")
    public PublicCaseStatus caseStatus(@Valid @RequestBody CaseLookupRequest r, HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        String who = fwd != null && !fwd.isBlank() ? fwd.split(",")[0].trim() : req.getRemoteAddr();
        return status.lookup(r.code(), r.phone(), who);
    }
}
