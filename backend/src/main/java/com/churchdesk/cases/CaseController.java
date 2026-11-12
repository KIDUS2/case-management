package com.churchdesk.cases;

import com.churchdesk.cases.CaseDtos.*;
import com.churchdesk.user.AppUser;
import com.churchdesk.user.CurrentUser;
import com.churchdesk.user.Role;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api")
public class CaseController {
    private static final String STAFF = "hasAnyRole('ADMIN','OFFICER','RECEPTION')";
    private final CaseService service;
    private final CaseFlowService flow;
    private final CurrentUser current;

    public CaseController(CaseService service, CaseFlowService flow, CurrentUser current) {
        this.service = service; this.flow = flow; this.current = current;
    }

    @GetMapping("/cases")
    public PageDto<CaseSummary> list(@RequestParam(required = false) String q,
                                     @RequestParam(required = false) CaseStatus status,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "12") int size, Authentication auth) {
        return service.list(q, status, page, size, current.get(auth));
    }

    @GetMapping("/cases/summary")
    public Summary summary(Authentication auth) { return service.summary(current.get(auth)); }

    @GetMapping("/cases/code/{code}")
    public CaseDetail byCode(@PathVariable String code, Authentication auth) { return service.getByCode(code, current.get(auth)); }

    @GetMapping("/cases/{id}")
    public CaseDetail get(@PathVariable Long id, Authentication auth) { return service.get(id, current.get(auth)); }

    @PostMapping("/cases") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize(STAFF)
    public CaseDetail create(@Valid @RequestBody CreateCaseRequest r, Authentication auth) {
        return service.create(r, current.get(auth));
    }

    @GetMapping("/persons/lookup") @PreAuthorize(STAFF)
    public List<PersonInfo> lookup(@RequestParam String name) { return service.lookup(name); }

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

    @PostMapping("/cases/{id}/parties")
    public CaseDetail addParty(@PathVariable Long id, @Valid @RequestBody AddPartyRequest r, Authentication auth) {
        return service.addParty(id, r, current.get(auth));
    }

    @PostMapping("/cases/{id}/links")
    public CaseDetail link(@PathVariable Long id, @Valid @RequestBody LinkRequest r, Authentication auth) {
        return service.linkCase(id, r.code(), current.get(auth));
    }

    @DeleteMapping("/cases/{id}/links/{otherId}")
    public CaseDetail unlink(@PathVariable Long id, @PathVariable Long otherId, Authentication auth) {
        return service.unlinkCase(id, otherId, current.get(auth));
    }

    // ---- the door queue and department inbox ----

    @GetMapping("/queue") @PreAuthorize(STAFF)
    public List<QueueItem> queue(@RequestParam(defaultValue = "14") int days) { return service.queue(days); }

    @GetMapping("/inbox")
    public InboxDto inbox(@RequestParam(required = false) Long departmentId,
                          @RequestParam(defaultValue = "false") boolean resolved,
                          @RequestParam(defaultValue = "0") int page,
                          @RequestParam(defaultValue = "20") int size, Authentication auth) {
        AppUser u = current.get(auth);
        Long dept;
        if (u.getRole() == Role.DEPARTMENT) dept = CaseAccess.departmentId(u);
        else if (u.getRole() == Role.ADMIN || u.getRole() == Role.OFFICER) dept = departmentId;
        else throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not available for your role");
        if (dept == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a department");
        return service.inbox(dept, resolved, page, size);
    }
}
