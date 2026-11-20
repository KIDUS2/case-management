package com.churchdesk.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import com.churchdesk.dto.request.InvestigationRequest;
import com.churchdesk.dto.response.InvestigationDto;
import com.churchdesk.enums.EventType;
import com.churchdesk.enums.Role;
import com.churchdesk.model.AppUser;
import com.churchdesk.model.CaseEvent;
import com.churchdesk.model.CaseGrant;
import com.churchdesk.model.ChurchCase;
import com.churchdesk.model.Investigation;
import com.churchdesk.repository.CaseEventRepository;
import com.churchdesk.repository.CaseGrantRepository;
import com.churchdesk.repository.ChurchCaseRepository;
import com.churchdesk.repository.InvestigationRepository;
import com.churchdesk.repository.UserRepository;

/**
 * Some cases need a committee (cooperation team) to look into them. The committee gets the case, writes what it found,
 * and that report is saved in the app and sent to the administrator and the person who asked.
 */
@Service
public class InvestigationService {
    private final InvestigationRepository repo;
    private final ChurchCaseRepository cases;
    private final CaseEventRepository events;
    private final CaseGrantRepository grants;
    private final UserRepository users;
    private final NotificationService notifier;
    private final AccessService access;

    public InvestigationService(InvestigationRepository repo, ChurchCaseRepository cases, CaseEventRepository events,
                                CaseGrantRepository grants, UserRepository users, NotificationService notifier, AccessService access) {
        this.repo = repo; this.cases = cases; this.events = events; this.grants = grants; this.users = users; this.notifier = notifier; this.access = access;
    }

    @Transactional
    public InvestigationDto ask(Long caseId, InvestigationRequest r, AppUser actor) {
        if (!actor.getRole().isDiocese()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the diocese can ask a committee to look into a case");
        ChurchCase c = load(caseId);
        Investigation inv = new Investigation();
        inv.setCaseId(c.getId());
        if (r.issueId() != null) {
            if (c.getIssues().stream().noneMatch(i -> r.issueId().equals(i.getId())))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That issue is not part of this case");
            inv.setIssueId(r.issueId());
        }
        inv.setInstruction(r.instruction().trim());
        inv.setTeam(blank(r.team()));
        inv.setRequestedBy(actor.getUsername());
        AppUser assignee = null;
        if (blank(r.assignedTo()) != null) {
            assignee = users.findByUsername(r.assignedTo().trim())
                    .filter(AppUser::isActive).filter(u -> u.getRole() != Role.SUBCITY)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a person from the list to receive this report"));
            inv.setAssignedTo(assignee.getUsername());
            // the committee member must be able to open the case
            if (!access.canView(c, assignee)) {
                CaseGrant g = new CaseGrant();
                g.setCaseId(c.getId()); g.setUserId(assignee.getId()); g.setGrantedBy(actor.getUsername());
                grants.save(g);
            }
        }
        inv = repo.save(inv);
        events.save(new CaseEvent(c.getId(), inv.getIssueId(), EventType.INVESTIGATION,
                "A committee was asked to look into this" + (inv.getTeam() == null ? "" : " (" + inv.getTeam() + ")") + ". " + inv.getInstruction(), actor.getUsername()));
        List<AppUser> who = new ArrayList<>(users.findByRoleAndActiveTrue(Role.ADMIN));
        if (assignee != null) who.add(assignee);
        notifier.send(who, "INVESTIGATION", "Committee asked to look into case " + code(c), inv.getInstruction(), c.getId(), c.getCode(), actor.getUsername());
        return toDto(inv, c);
    }

    @Transactional
    public InvestigationDto report(Long id, String text, AppUser actor) {
        Investigation inv = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Investigation not found"));
        boolean mine = actor.getUsername().equals(inv.getAssignedTo());
        if (!mine && !actor.getRole().isDiocese())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the committee member it was given to, or the diocese, can send the report");
        if ("CLOSED".equals(inv.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "This investigation is already closed");
        ChurchCase c = load(inv.getCaseId());
        inv.setReport(text.trim());
        inv.setReportedBy(actor.getUsername());
        inv.setReportedAt(Instant.now());
        inv.setStatus("REPORTED");
        events.save(new CaseEvent(c.getId(), inv.getIssueId(), EventType.INVESTIGATION, "Committee report: " + inv.getReport(), actor.getUsername()));
        List<AppUser> who = new ArrayList<>(users.findByRoleAndActiveTrue(Role.ADMIN));
        users.findByUsername(inv.getRequestedBy()).ifPresent(who::add);
        notifier.send(who, "INVESTIGATION", "Committee report for case " + code(c), inv.getReport(), c.getId(), c.getCode(), actor.getUsername());
        return toDto(inv, c);
    }

    @Transactional
    public InvestigationDto close(Long id, AppUser actor) {
        if (!actor.getRole().isDiocese()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the diocese can close an investigation");
        Investigation inv = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Investigation not found"));
        ChurchCase c = load(inv.getCaseId());
        inv.setStatus("CLOSED");
        events.save(new CaseEvent(c.getId(), inv.getIssueId(), EventType.INVESTIGATION, "Investigation closed", actor.getUsername()));
        return toDto(inv, c);
    }

    @Transactional(readOnly = true)
    public List<InvestigationDto> forCase(Long caseId, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        return repo.findByCaseIdOrderByIdDesc(caseId).stream().map(i -> toDto(i, c)).toList();
    }

    /** What is waiting for this person: committee work given to them, or (diocese) reports waiting to be read. */
    @Transactional(readOnly = true)
    public List<InvestigationDto> waiting(AppUser actor) {
        List<Investigation> list = new ArrayList<>(repo.findByAssignedToAndStatusOrderByIdDesc(actor.getUsername(), "OPEN"));
        if (actor.getRole().isDiocese()) list.addAll(repo.findByStatusOrderByIdDesc("REPORTED"));
        return list.stream().map(i -> toDto(i, load(i.getCaseId()))).toList();
    }

    private InvestigationDto toDto(Investigation i, ChurchCase c) {
        String name = i.getAssignedTo() == null ? null : users.findByUsername(i.getAssignedTo()).map(AppUser::getFullName).orElse(i.getAssignedTo());
        return new InvestigationDto(i.getId(), c.getId(), c.getCode(), i.getIssueId(), i.getInstruction(), i.getTeam(), i.getAssignedTo(), name,
                i.getStatus(), i.getRequestedBy(), i.getRequestedAt(), i.getReport(), i.getReportedBy(), i.getReportedAt());
    }

    private ChurchCase load(Long id) { return cases.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found")); }
    private static String blank(String s) { return s == null || s.isBlank() ? null : s.trim(); }
    private static String code(ChurchCase c) { return c.getCode().length() == 6 ? c.getCode().substring(0, 3) + "-" + c.getCode().substring(3) : c.getCode(); }
}
