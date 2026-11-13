package com.churchdesk.cases;

import com.churchdesk.department.Department;
import com.churchdesk.department.DepartmentRepository;
import com.churchdesk.notification.NotificationService;
import com.churchdesk.user.AppUser;
import com.churchdesk.user.Role;
import com.churchdesk.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Everything that moves an issue forward: refer, resolve, court, acknowledge. Each step is recorded and the right people are notified. */
@Service
public class CaseFlowService {
    private final ChurchCaseRepository cases;
    private final CaseEventRepository events;
    private final DepartmentRepository departments;
    private final UserRepository users;
    private final NotificationService notifier;
    private final AccessService access;
    private final com.churchdesk.option.OptionService options;
    private final CaseIssueRepository issueRepo;

    public CaseFlowService(ChurchCaseRepository cases, CaseEventRepository events, DepartmentRepository departments,
                           UserRepository users, NotificationService notifier, AccessService access, CaseIssueRepository issueRepo, com.churchdesk.option.OptionService options) {
        this.options = options; this.issueRepo = issueRepo; this.cases = cases; this.events = events; this.departments = departments; this.users = users; this.notifier = notifier; this.access = access;
    }

    // ---- used while registering a new case ----

    public void recordCreated(ChurchCase c, AppUser actor) {
        events.save(new CaseEvent(c.getId(), null, EventType.CREATED, "Case registered", actor.getUsername()));
    }

    /** Sends one issue to a department. The caller has already saved the case. */
    public void applyReferral(ChurchCase c, CaseIssue i, Department d, LocalDate returnOn, String note, AppUser actor) {
        if (!d.isActive()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, d.getName() + " is not active right now");
        if (i.getStatus() == IssueStatus.RESOLVED) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That issue is already resolved");
        if (returnOn != null && returnOn.isBefore(Times.today()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The return date cannot be in the past");
        i.setDepartment(d);
        i.setStatus(IssueStatus.REFERRED);
        i.setReferredAt(Instant.now());
        i.setReturnOn(returnOn);
        i.setEscalationLevel(0); i.setEscalatedAt(null);
        i.setResolvedAt(null); i.setResolvedBy(null); i.setResolutionNote(null);

        StringBuilder msg = new StringBuilder(label(i.getCategory())).append(" issue sent to ").append(d.getName());
        if (returnOn != null) msg.append(". Person asked to come back on ").append(returnOn);
        if (note != null && !note.isBlank()) msg.append(". ").append(note.trim());
        events.save(new CaseEvent(c.getId(), i.getId(), EventType.REFERRED, msg.toString(), actor.getUsername()));

        notifier.send(users.findByDepartmentIdAndActiveTrue(d.getId()), "REFERRED",
                "New " + label(i.getCategory()) + " issue for " + d.getName(),
                "Case " + code(c) + " · " + complainant(c) + (note == null || note.isBlank() ? "" : " — " + note.trim()),
                c.getId(), c.getCode(), actor.getUsername());
        refreshStatus(c);
    }

    // ---- steps on an existing case ----

    @Transactional
    public void refer(Long caseId, Long issueId, Long departmentId, LocalDate returnOn, String note, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        CaseIssue i = issue(c, issueId);
        Department d = departments.findById(departmentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));
        applyReferral(c, i, d, returnOn, note, actor);
    }

    @Transactional
    public void resolve(Long caseId, Long issueId, String note, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        CaseIssue i = issue(c, issueId);
        if (!CaseAccess.canResolve(actor, i))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the department that received this issue (or an officer) can resolve it");
        if (i.getStatus() == IssueStatus.RESOLVED) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That issue is already resolved");
        // departments serve in order; only the administrator or an officer may jump the queue (or mark an issue urgent)
        if (actor.getRole() == Role.DEPARTMENT && i.getDepartment() != null && i.getStatus() == IssueStatus.REFERRED) {
            long ahead = issueRepo.countAhead(i.getDepartment().getId(), IssueStatus.REFERRED, i.getId(), i.getPriority(), i.getReferredAt());
            if (ahead > 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Serve the cases in order. " + ahead + (ahead == 1 ? " case is" : " cases are")
                    + " ahead of this one in your queue. If this one cannot wait, ask the administrator to mark it urgent.");
        }
        i.setStatus(IssueStatus.RESOLVED);
        i.setResolvedAt(Instant.now());
        i.setResolvedBy(actor.getUsername());
        i.setResolutionNote(blankToNull(note));
        i.setReturnOn(null);
        refreshStatus(c);

        String by = i.getDepartment() != null ? i.getDepartment().getName() : actor.getFullName();
        events.save(new CaseEvent(c.getId(), i.getId(), EventType.RESOLVED,
                label(i.getCategory()) + " issue resolved by " + by + (i.getResolutionNote() == null ? "" : ". " + i.getResolutionNote()), actor.getUsername()));

        boolean whole = c.getStatus() == CaseStatus.RESOLVED;
        List<AppUser> who = new ArrayList<>(users.findByRoleAndActiveTrue(Role.ADMIN));
        users.findByUsername(c.getCreatedBy()).ifPresent(who::add);
        notifier.send(who, "RESOLVED",
                whole ? "Case " + code(c) + " fully resolved" : label(i.getCategory()) + " issue resolved by " + by,
                "Case " + code(c) + " · " + complainant(c) + (i.getResolutionNote() == null ? "" : " — " + i.getResolutionNote()),
                c.getId(), c.getCode(), actor.getUsername());
    }

    /** Only the administrator decides what jumps the queue. */
    @Transactional
    public void setUrgent(Long caseId, Long issueId, boolean urgent, AppUser actor) {
        if (actor.getRole() != Role.ADMIN) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the administrator can mark an issue urgent");
        ChurchCase c = load(caseId);
        CaseIssue i = issue(c, issueId);
        if (i.getStatus() == IssueStatus.RESOLVED) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That issue is already resolved");
        if (i.isUrgent() == urgent) return;
        i.setPriority(urgent ? "URGENT" : "NORMAL");
        i.setUrgentBy(urgent ? actor.getUsername() : null);
        i.setUrgentAt(urgent ? Instant.now() : null);
        events.save(new CaseEvent(c.getId(), i.getId(), EventType.NOTE,
                urgent ? "Marked URGENT by the administrator: served before the others" : "No longer urgent: served in order", actor.getUsername()));
        if (urgent && i.getDepartment() != null)
            notifier.send(users.findByDepartmentIdAndActiveTrue(i.getDepartment().getId()), "URGENT", "Urgent · case " + code(c),
                    "The administrator marked this " + label(i.getCategory()) + " issue urgent. Serve it first.", c.getId(), c.getCode(), actor.getUsername());
    }

    @Transactional
    public void court(Long caseId, Long issueId, String note, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        CaseIssue i = issue(c, issueId);
        if (i.getStatus() == IssueStatus.RESOLVED) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That issue is already resolved");
        i.setStatus(IssueStatus.COURT);
        i.setCourtAt(Instant.now());
        i.setCourtAckAt(null); i.setCourtAckBy(null);
        refreshStatus(c);
        events.save(new CaseEvent(c.getId(), i.getId(), EventType.COURT,
                label(i.getCategory()) + " issue taken to court" + (blankToNull(note) == null ? "" : ". " + note.trim()), actor.getUsername()));
        notifier.send(users.findByRoleAndActiveTrue(Role.ADMIN), "COURT", "Case " + code(c) + " is in court",
                "Needs your acknowledgment · " + complainant(c), c.getId(), c.getCode(), actor.getUsername());
    }

    /** The Addis Ababa diocese admin confirms they know about a court case. */
    @Transactional
    public void acknowledgeCourt(Long caseId, Long issueId, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        CaseIssue i = issue(c, issueId);
        if (i.getCourtAt() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This issue has not gone to court");
        if (i.getCourtAckAt() != null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Already acknowledged");
        i.setCourtAckAt(Instant.now());
        i.setCourtAckBy(actor.getUsername());
        events.save(new CaseEvent(c.getId(), i.getId(), EventType.COURT_ACK, "Court case acknowledged by " + actor.getFullName(), actor.getUsername()));
        users.findByUsername(c.getCreatedBy()).ifPresent(u -> notifier.send(List.of(u), "COURT", "Court case " + code(c) + " acknowledged",
                "Acknowledged by " + actor.getFullName(), c.getId(), c.getCode(), actor.getUsername()));
    }

    /** The person came back to the door: they are no longer "expected". */
    @Transactional
    public void arrived(Long caseId, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        for (CaseIssue i : c.getIssues()) if (i.getStatus() != IssueStatus.RESOLVED) i.setReturnOn(null);
        events.save(new CaseEvent(c.getId(), null, EventType.ARRIVED, "Person came back to the door", actor.getUsername()));
    }

    @Transactional
    public void addNote(Long caseId, String text, AppUser actor) {
        if (text == null || text.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please write a note");
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        access.assertCanView(c, actor);
        events.save(new CaseEvent(c.getId(), null, EventType.NOTE, text.trim(), actor.getUsername()));
    }

    @Transactional
    public void setLetter(Long caseId, boolean issued, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        if (c.isLetterIssued() == issued) return;
        c.setLetterIssued(issued);
        events.save(new CaseEvent(c.getId(), null, EventType.LETTER, issued ? "Letter issued" : "Letter marked as not issued", actor.getUsername()));
    }

    // ---- helpers ----

    /** A case is resolved only when every issue is; otherwise it shows its most urgent state. */
    public void refreshStatus(ChurchCase c) {
        List<CaseIssue> list = c.getIssues();
        CaseStatus s;
        if (!list.isEmpty() && list.stream().allMatch(i -> i.getStatus() == IssueStatus.RESOLVED)) s = CaseStatus.RESOLVED;
        else if (list.stream().anyMatch(i -> i.getStatus() == IssueStatus.COURT)) s = CaseStatus.COURT;
        else if (list.stream().anyMatch(i -> i.getStatus() == IssueStatus.REFERRED)) s = CaseStatus.REFERRED;
        else s = CaseStatus.OPEN;
        c.setStatus(s);
    }

    private ChurchCase load(Long id) {
        return cases.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
    }

    private CaseIssue issue(ChurchCase c, Long issueId) {
        return c.getIssues().stream().filter(i -> i.getId().equals(issueId)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found"));
    }

    private static String complainant(ChurchCase c) {
        return c.getParties().stream().filter(p -> p.getRole() == PartyRole.COMPLAINANT).findFirst()
                .map(p -> p.getPerson().getFullName()).orElse("");
    }

    private static String code(ChurchCase c) { return c.getCode().length() == 6 ? c.getCode().substring(0, 3) + "-" + c.getCode().substring(3) : c.getCode(); }

    private String label(String k) { return options.issueTypeLabel(k); }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}
