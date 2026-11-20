package com.churchdesk.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import com.churchdesk.dto.common.PageDto;
import com.churchdesk.dto.request.AddPartyRequest;
import com.churchdesk.dto.request.CreateCaseRequest;
import com.churchdesk.dto.request.HoldRequest;
import com.churchdesk.dto.request.IssueIn;
import com.churchdesk.dto.request.LetterRequest;
import com.churchdesk.dto.request.LinkRequest;
import com.churchdesk.dto.request.NoteRequest;
import com.churchdesk.dto.request.ReferRequest;
import com.churchdesk.dto.request.ReviewRequest;
import com.churchdesk.dto.request.TextRequest;
import com.churchdesk.dto.request.UrgentRequest;
import com.churchdesk.dto.response.CaseDetail;
import com.churchdesk.dto.response.CaseSummary;
import com.churchdesk.dto.response.InboxDto;
import com.churchdesk.dto.response.PersonInfo;
import com.churchdesk.dto.response.QueueItem;
import com.churchdesk.dto.response.Summary;
import com.churchdesk.enums.CaseKind;
import com.churchdesk.enums.CaseStatus;
import com.churchdesk.enums.ReviewStatus;
import com.churchdesk.enums.Role;
import com.churchdesk.model.AppUser;
import com.churchdesk.security.CurrentUser;
import com.churchdesk.service.AuditService;
import com.churchdesk.service.CaseFlowService;
import com.churchdesk.service.CaseService;
import com.churchdesk.util.CaseAccess;

@RestController
@RequestMapping("/api")
public class CaseController {
    private static final String STAFF = "hasAnyRole('ADMIN','OFFICER','RECEPTION','SERA_ASKIYAJIE','PAPAS')";
    private final CaseService service;
    private final CaseFlowService flow;
    private final CurrentUser current;

    private final AuditService audit;

    public CaseController(CaseService service, CaseFlowService flow, CurrentUser current, AuditService audit) {
        this.audit = audit; this.service = service; this.flow = flow; this.current = current;
    }

    @GetMapping("/cases")
    public PageDto<CaseSummary> list(@RequestParam(required = false) String q,
                                     @RequestParam(required = false) CaseStatus status,
                                     @RequestParam(required = false) ReviewStatus review,
                                     @RequestParam(required = false) CaseKind kind,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "12") int size, Authentication auth) {
        return service.list(q, status, review, kind, page, size, current.get(auth));
    }

    @GetMapping("/cases/summary")
    public Summary summary(Authentication auth) { return service.summary(current.get(auth)); }

    @GetMapping("/cases/code/{code}")
    public CaseDetail byCode(@PathVariable String code, Authentication auth) { return service.getByCode(code, current.get(auth)); }

    @GetMapping("/cases/{id}")
    public CaseDetail get(@PathVariable Long id, Authentication auth) {
        AppUser u = current.get(auth);
        CaseDetail d = service.get(id, u);
        audit.record(u.getUsername(), "CASE_VIEW", "CASE", String.valueOf(id), "Case " + d.code());
        return d;
    }

    @PostMapping("/cases") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize(STAFF)
    public CaseDetail create(@Valid @RequestBody CreateCaseRequest r, Authentication auth) {
        return service.create(r, current.get(auth));
    }

    /** A sub-city office submits a case for review. */
    @PostMapping("/cases/submit") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('SUBCITY')")
    public CaseDetail submit(@Valid @RequestBody CreateCaseRequest r, Authentication auth) {
        return service.submit(r, current.get(auth));
    }

    /** Accept a submitted case, or return it to the sub-city with a reason. */
    @PostMapping("/cases/{id}/review") @PreAuthorize("hasAnyRole('ADMIN','OFFICER','SERA_ASKIYAJIE','PAPAS')")
    public CaseDetail review(@PathVariable Long id, @Valid @RequestBody ReviewRequest r, Authentication auth) {
        AppUser u = current.get(auth);
        flow.review(id, r.accept(), r.note(), u);
        return service.get(id, u);
    }

    @GetMapping("/persons/lookup") @PreAuthorize(STAFF)
    public List<PersonInfo> lookup(@RequestParam String name) { return service.lookup(name); }

    @GetMapping("/persons/by-employee-id") @PreAuthorize(STAFF)
    public PersonInfo byEmployeeId(@RequestParam String id) {
        PersonInfo p = service.byEmployeeId(id);
        if (p == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No employee with ID " + id.trim());
        return p;
    }

    // ---- moving a case forward ----

    @PostMapping("/cases/{id}/issues/{issueId}/refer") @PreAuthorize(STAFF)
    public CaseDetail refer(@PathVariable Long id, @PathVariable Long issueId, @Valid @RequestBody ReferRequest r, Authentication auth) {
        AppUser u = current.get(auth);
        flow.refer(id, issueId, r.departmentId(), r.returnOn(), r.note(), u);
        return service.get(id, u);
    }

    @PostMapping("/cases/{id}/issues/{issueId}/resolve")
    public CaseDetail resolve(@PathVariable Long id, @PathVariable Long issueId, @Valid @RequestBody(required = false) NoteRequest r, Authentication auth) {
        AppUser u = current.get(auth);
        flow.resolve(id, issueId, r == null ? null : r.note(), u);
        return service.get(id, u);
    }

    @PostMapping("/cases/{id}/issues/{issueId}/hold")
    public CaseDetail hold(@PathVariable Long id, @PathVariable Long issueId, @Valid @RequestBody HoldRequest r, Authentication auth) {
        AppUser u = current.get(auth);
        flow.hold(id, issueId, r.hold(), r.reason(), u);
        return service.get(id, u);
    }

    @PostMapping("/cases/{id}/issues/{issueId}/escalate")
    public CaseDetail escalate(@PathVariable Long id, @PathVariable Long issueId, @Valid @RequestBody TextRequest r, Authentication auth) {
        AppUser u = current.get(auth);
        flow.escalate(id, issueId, r.text(), u);
        return service.get(id, u);
    }

    @PutMapping("/cases/{id}/issues/{issueId}/urgent") @PreAuthorize("hasRole('ADMIN')")
    public CaseDetail urgent(@PathVariable Long id, @PathVariable Long issueId, @RequestBody UrgentRequest r, Authentication auth) {
        AppUser u = current.get(auth);
        flow.setUrgent(id, issueId, r.urgent(), u);
        return service.get(id, u);
    }

    @PostMapping("/cases/{id}/issues/{issueId}/court") @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public CaseDetail court(@PathVariable Long id, @PathVariable Long issueId, @Valid @RequestBody(required = false) NoteRequest r, Authentication auth) {
        AppUser u = current.get(auth);
        flow.court(id, issueId, r == null ? null : r.note(), u);
        return service.get(id, u);
    }

    @PostMapping("/cases/{id}/issues/{issueId}/acknowledge") @PreAuthorize("hasRole('ADMIN')")
    public CaseDetail acknowledge(@PathVariable Long id, @PathVariable Long issueId, Authentication auth) {
        AppUser u = current.get(auth);
        flow.acknowledgeCourt(id, issueId, u);
        return service.get(id, u);
    }

    @PostMapping("/cases/{id}/arrived") @PreAuthorize(STAFF)
    public CaseDetail arrived(@PathVariable Long id, Authentication auth) {
        AppUser u = current.get(auth);
        flow.arrived(id, u);
        return service.get(id, u);
    }

    @PostMapping("/cases/{id}/notes")
    public CaseDetail note(@PathVariable Long id, @Valid @RequestBody NoteRequest r, Authentication auth) {
        AppUser u = current.get(auth);
        flow.addNote(id, r.note(), u);
        return service.get(id, u);
    }

    @PutMapping("/cases/{id}/letter") @PreAuthorize(STAFF)
    public CaseDetail letter(@PathVariable Long id, @RequestBody LetterRequest r, Authentication auth) {
        AppUser u = current.get(auth);
        flow.setLetter(id, r.issued(), u);
        return service.get(id, u);
    }

    @PostMapping("/cases/{id}/parties") @PreAuthorize("!hasRole('SUBCITY')")
    public CaseDetail addParty(@PathVariable Long id, @Valid @RequestBody AddPartyRequest r, Authentication auth) {
        return service.addParty(id, r, current.get(auth));
    }

    @PostMapping("/cases/{id}/issues") @PreAuthorize(STAFF)
    public CaseDetail addIssue(@PathVariable Long id, @Valid @RequestBody IssueIn r, Authentication auth) {
        return service.addIssue(id, r, current.get(auth));
    }

    @PostMapping("/cases/{id}/links") @PreAuthorize("!hasRole('SUBCITY')")
    public CaseDetail link(@PathVariable Long id, @Valid @RequestBody LinkRequest r, Authentication auth) {
        return service.linkCase(id, r.code(), current.get(auth));
    }

    @DeleteMapping("/cases/{id}/links/{otherId}") @PreAuthorize("!hasRole('SUBCITY')")
    public CaseDetail unlink(@PathVariable Long id, @PathVariable Long otherId, Authentication auth) {
        return service.unlinkCase(id, otherId, current.get(auth));
    }

    // ---- the door queue and department inbox ----

    @GetMapping("/queue") @PreAuthorize(STAFF)
    public List<QueueItem> queue(@RequestParam(defaultValue = "14") int days) { return service.queue(days); }

    /** What was passed up: Sera Askiyajie sees what waits for him, Papas what waits for the final decision. */
    @GetMapping("/inbox/passed-up") @PreAuthorize("hasAnyRole('ADMIN','SERA_ASKIYAJIE','PAPAS')")
    public InboxDto passedUp(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size, Authentication auth) {
        return service.escalatedInbox(current.get(auth), page, size);
    }

    @GetMapping("/inbox")
    public InboxDto inbox(@RequestParam(required = false) Long departmentId,
                          @RequestParam(defaultValue = "false") boolean resolved,
                          @RequestParam(defaultValue = "0") int page,
                          @RequestParam(defaultValue = "20") int size, Authentication auth) {
        AppUser u = current.get(auth);
        Long dept;
        if (u.getRole() == Role.DEPARTMENT) dept = CaseAccess.departmentId(u);
        else if (u.getRole().isDiocese()) dept = departmentId;
        else throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not available for your role");
        if (dept == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a department");
        return service.inbox(dept, resolved, page, size);
    }
}
