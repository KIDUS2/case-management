package com.churchdesk.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import com.churchdesk.enums.CaseStatus;
import com.churchdesk.enums.EventType;
import com.churchdesk.enums.IssueStatus;
import com.churchdesk.enums.PartyRole;
import com.churchdesk.enums.ReviewStatus;
import com.churchdesk.enums.Role;
import com.churchdesk.model.Appointment;
import com.churchdesk.model.AppUser;
import com.churchdesk.model.CaseEvent;
import com.churchdesk.model.CaseIssue;
import com.churchdesk.model.ChurchCase;
import com.churchdesk.model.Department;
import com.churchdesk.model.Person;
import com.churchdesk.repository.CaseEventRepository;
import com.churchdesk.repository.CaseIssueRepository;
import com.churchdesk.repository.ChurchCaseRepository;
import com.churchdesk.repository.DepartmentRepository;
import com.churchdesk.repository.UserRepository;
import com.churchdesk.util.CaseAccess;
import com.churchdesk.util.Times;

/** Everything that moves an issue forward: refer, resolve, court, acknowledge. Each step is recorded and the right people are notified. */
@Service
public class CaseFlowService {
    private final ChurchCaseRepository cases;
    private final CaseEventRepository events;
    private final DepartmentRepository departments;
    private final UserRepository users;
    private final NotificationService notifier;
    private final AccessService access;
    private final com.churchdesk.service.OptionService options;
    private final CaseIssueRepository issueRepo;
    private final AppointmentService appointments;
    private final SmsService sms;

    public CaseFlowService(ChurchCaseRepository cases, CaseEventRepository events, DepartmentRepository departments,
                           UserRepository users, NotificationService notifier, AccessService access, CaseIssueRepository issueRepo, com.churchdesk.service.OptionService options,
                           AppointmentService appointments, SmsService sms) {
        this.appointments = appointments; this.sms = sms;
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
        LocalDate previous = i.getReturnOn();
        i.setDepartment(d);
        i.setStatus(IssueStatus.REFERRED);
        i.setReferredAt(Instant.now());
        i.setReturnOn(returnOn);
        // an appointment takes one of the day's limited spots; a new date frees the old one
        if (previous != null && !previous.equals(returnOn)
                && c.getIssues().stream().noneMatch(o -> o != i && o.getStatus() != IssueStatus.RESOLVED && previous.equals(o.getReturnOn())))
            appointments.cancelDay(c.getId(), previous);
        if (returnOn != null) {
            Appointment ap = appointments.book(c.getId(), returnOn, actor.getUsername());
            events.save(new CaseEvent(c.getId(), i.getId(), EventType.APPOINTMENT,
                    "Appointment on " + returnOn + ", spot " + ap.getSpotNo(), actor.getUsername()));
        }
        i.setEscalationLevel(0); i.setEscalatedAt(null);
        i.setHandlerLevel(0); i.setHeld(false); i.setHoldReason(null); i.setHeldAt(null);
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

    /** Tells the administrator and the officers that a sub-city sent a case and it is waiting for them. */
    public void notifySubmitted(ChurchCase c, AppUser actor) {
        events.save(new CaseEvent(c.getId(), null, EventType.NOTE, "Submitted by the " + actor.getSubCity() + " sub-city for review", actor.getUsername()));
        List<AppUser> who = new ArrayList<>(users.findByRoleAndActiveTrue(Role.ADMIN));
        who.addAll(users.findByRoleAndActiveTrue(Role.OFFICER));
        notifier.send(who, "SUBMITTED", "New case from " + actor.getSubCity(),
                "Case " + code(c) + " · " + complainant(c) + " is waiting for your review", c.getId(), c.getCode(), actor.getUsername());
    }

    /** An officer or the administrator accepts a submitted case, or returns it to the sub-city with a reason. */
    @Transactional
    public void review(Long caseId, boolean accept, String note, AppUser actor) {
        if (!actor.getRole().isDiocese())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the diocese (administrator, officer, Sera Askiyajie or Papas) can review a submitted case");
        ChurchCase c = load(caseId);
        if (c.getReviewStatus() != ReviewStatus.PENDING) throw new ResponseStatusException(HttpStatus.CONFLICT, "This case is not waiting for review");
        String reason = blankToNull(note);
        if (!accept && reason == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please write why the case is returned, so the sub-city knows what to fix");
        c.setReviewStatus(accept ? ReviewStatus.ACCEPTED : ReviewStatus.RETURNED);
        c.setReviewNote(reason);
        c.setReviewedBy(actor.getUsername());
        c.setReviewedAt(Instant.now());
        events.save(new CaseEvent(c.getId(), null, EventType.NOTE,
                (accept ? "Accepted by " : "Returned to the sub-city by ") + actor.getFullName() + (reason == null ? "" : ". " + reason), actor.getUsername()));
        users.findByUsername(c.getCreatedBy()).ifPresent(u -> notifier.send(List.of(u), accept ? "ACCEPTED" : "RETURNED",
                accept ? "Case " + code(c) + " accepted" : "Case " + code(c) + " returned",
                accept ? "The diocese accepted your case · " + complainant(c) : "Reason: " + reason, c.getId(), c.getCode(), actor.getUsername()));
    }

    /** Nothing moves on a case the diocese has not accepted yet. */
    private static void assertReviewed(ChurchCase c) {
        if (c.getReviewStatus() != ReviewStatus.ACCEPTED)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Accept this case first. It was submitted by a sub-city and has not been reviewed.");
    }

    // ---- steps on an existing case ----

    @Transactional
    public void refer(Long caseId, Long issueId, Long departmentId, LocalDate returnOn, String note, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        assertReviewed(c);
        CaseIssue i = issue(c, issueId);
        Department d = departments.findById(departmentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));
        applyReferral(c, i, d, returnOn, note, actor);
        if (returnOn != null) sms.sendCaseNumber(c, actor.getUsername());
    }

    @Transactional
    public void resolve(Long caseId, Long issueId, String note, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        assertReviewed(c);
        CaseIssue i = issue(c, issueId);
        if (!CaseAccess.canResolve(actor, i))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the department that received this issue (or an officer) can resolve it");
        if (i.getStatus() == IssueStatus.RESOLVED) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That issue is already resolved");
        // departments serve in order; only the administrator or an officer may jump the queue (or mark an issue urgent)
        if (actor.getRole() == Role.DEPARTMENT && i.getDepartment() != null && i.getStatus() == IssueStatus.REFERRED && !i.isHeld()) {
            long ahead = issueRepo.countAhead(i.getDepartment().getId(), IssueStatus.REFERRED, i.getId(), i.getPriority(), i.getReferredAt());
            if (ahead > 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Serve the cases in order. " + ahead + (ahead == 1 ? " case is" : " cases are")
                    + " ahead of this one in your queue. If this one cannot wait, ask the administrator to mark it urgent.");
        }
        i.setStatus(IssueStatus.RESOLVED);
        i.setResolvedAt(Instant.now());
        i.setResolvedBy(actor.getUsername());
        i.setResolutionNote(blankToNull(note));
        i.setReturnOn(null);
        i.setHeld(false); i.setHoldReason(null); i.setHeldAt(null);
        refreshStatus(c);

        String by = i.getHandlerLevel() >= 1 || i.getDepartment() == null ? actor.getFullName() + roleLabel(actor.getRole()) : i.getDepartment().getName();
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

    private static String roleLabel(Role r) {
        return switch (r) { case PAPAS -> " (Papas, final decision)"; case SERA_ASKIYAJIE -> " (Sera Askiyajie)"; default -> ""; };
    }

    /**
     * Sets an issue aside because it needs time (documents, a witness, a meeting). The issues behind it are no
     * longer blocked; it keeps its place and comes back when it is put back in the line.
     */
    @Transactional
    public void hold(Long caseId, Long issueId, boolean hold, String reason, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        assertReviewed(c);
        CaseIssue i = issue(c, issueId);
        if (i.getStatus() == IssueStatus.RESOLVED) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That issue is already resolved");
        if (!CaseAccess.canResolve(actor, i))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the department handling this issue, or the diocese, can set it aside");
        if (i.isHeld() == hold) return;
        String why = blankToNull(reason);
        if (hold && why == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please write what it is waiting for");
        i.setHeld(hold);
        i.setHoldReason(hold ? why : null);
        i.setHeldAt(hold ? Instant.now() : null);
        events.save(new CaseEvent(c.getId(), i.getId(), EventType.HOLD,
                hold ? label(i.getCategory()) + " issue set aside. Waiting for: " + why : label(i.getCategory()) + " issue is back in the line", actor.getUsername()));
    }

    /**
     * Passes an issue up: department -> Sera Askiyajie -> Papas. Each level can see everything below it and can give
     * the decision; Papas gives the final one.
     */
    @Transactional
    public void escalate(Long caseId, Long issueId, String reason, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        assertReviewed(c);
        CaseIssue i = issue(c, issueId);
        if (i.getStatus() == IssueStatus.RESOLVED) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That issue is already resolved");
        String why = blankToNull(reason);
        if (why == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please write why this needs a higher decision");
        int from = i.getHandlerLevel();
        Role role = actor.getRole();
        int to;
        if (role == Role.PAPAS) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Papas gives the final decision. It cannot go higher.");
        else if (role == Role.SERA_ASKIYAJIE) to = 2;
        else if (role == Role.ADMIN || role == Role.OFFICER || role == Role.RECEPTION) to = Math.min(from + 1, 2);
        else if (role == Role.DEPARTMENT && CaseAccess.canResolve(actor, i)) to = 1;
        else throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot pass this issue up");
        if (to <= from) throw new ResponseStatusException(HttpStatus.CONFLICT, "This issue is already with " + (from == 1 ? "Sera Askiyajie" : "Papas"));
        i.setHandlerLevel(to);
        i.setHeld(false); i.setHoldReason(null); i.setHeldAt(null);
        String who = to == 1 ? "Sera Askiyajie" : "Papas";
        events.save(new CaseEvent(c.getId(), i.getId(), EventType.ESCALATED, label(i.getCategory()) + " issue passed up to " + who + ". " + why, actor.getUsername()));
        List<AppUser> to_ = new ArrayList<>(users.findByRoleAndActiveTrue(to == 1 ? Role.SERA_ASKIYAJIE : Role.PAPAS));
        to_.addAll(users.findByRoleAndActiveTrue(Role.ADMIN));
        notifier.send(to_, "ESCALATED", "Needs " + (to == 1 ? "your attention" : "your final decision") + " · case " + code(c),
                label(i.getCategory()) + " · " + complainant(c) + " — " + why, c.getId(), c.getCode(), actor.getUsername());
    }

    /** A sub-city solved the case itself: every issue is closed with its solution and the diocese is shown it. */
    @Transactional
    public void resolveLocally(ChurchCase c, String solution, AppUser actor) {
        c.setSubCitySolved(true);
        for (CaseIssue i : c.getIssues()) {
            if (i.getStatus() == IssueStatus.RESOLVED) continue;
            i.setStatus(IssueStatus.RESOLVED);
            i.setResolvedAt(Instant.now());
            i.setResolvedBy(actor.getUsername());
            i.setResolutionNote(solution);
        }
        refreshStatus(c);
        events.save(new CaseEvent(c.getId(), null, EventType.RESOLVED,
                "Solved by the " + actor.getSubCity() + " sub-city and shared with the diocese. " + solution, actor.getUsername()));
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
        assertReviewed(c);
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
        appointments.markArrived(c.getId());
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
