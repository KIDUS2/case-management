package com.churchdesk.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import com.churchdesk.dto.response.CaseFileDto;
import com.churchdesk.dto.response.InquiryDto;
import com.churchdesk.enums.EventType;
import com.churchdesk.enums.PartyRole;
import com.churchdesk.enums.Role;
import com.churchdesk.model.AppUser;
import com.churchdesk.model.CaseEvent;
import com.churchdesk.model.CaseFile;
import com.churchdesk.model.CaseIssue;
import com.churchdesk.model.CaseParty;
import com.churchdesk.model.ChurchCase;
import com.churchdesk.model.ChurchInquiry;
import com.churchdesk.repository.CaseEventRepository;
import com.churchdesk.repository.CaseFileRepository;
import com.churchdesk.repository.ChurchCaseRepository;
import com.churchdesk.repository.ChurchInquiryRepository;
import com.churchdesk.repository.DepartmentRepository;
import com.churchdesk.repository.UserRepository;
import com.churchdesk.util.CaseAccess;

/**
 * The church loop: a department (or the desk) sends a comment to the church, the desk records what the church
 * found and sent back, and the administrator decides. If the church does not agree, everyone involved is told.
 */
@Service
public class InquiryService {

    private final ChurchInquiryRepository repo;
    private final ChurchCaseRepository cases;
    private final CaseFileRepository fileRepo;
    private final CaseEventRepository events;
    private final DepartmentRepository departments;
    private final UserRepository users;
    private final NotificationService notifier;
    private final AccessService access;

    public InquiryService(ChurchInquiryRepository repo, ChurchCaseRepository cases, CaseFileRepository fileRepo, CaseEventRepository events,
                          DepartmentRepository departments, UserRepository users, NotificationService notifier, AccessService access) {
        this.repo = repo; this.cases = cases; this.fileRepo = fileRepo; this.events = events;
        this.departments = departments; this.users = users; this.notifier = notifier; this.access = access;
    }

    @Transactional(readOnly = true)
    public List<InquiryDto> forCase(Long caseId, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        return repo.findByCaseIdOrderByAskedAtDesc(caseId).stream().map(i -> dto(i, c)).toList();
    }

    /** Inquiries the church has answered and the administrator has not yet decided on. */
    @Transactional(readOnly = true)
    public List<InquiryDto> waitingForAdmin(AppUser actor) {
        List<InquiryDto> out = new ArrayList<>();
        for (ChurchInquiry i : repo.findByStatusOrderByFindingAtAsc(ChurchInquiry.ANSWERED)) {
            ChurchCase c = cases.findById(i.getCaseId()).orElse(null);
            if (c != null && access.canView(c, actor)) out.add(dto(i, c));
        }
        return out;
    }

    @Transactional
    public InquiryDto ask(Long caseId, Long issueId, String question, AppUser actor) {
        if (question == null || question.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please write the comment for the church");
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        ChurchInquiry i = new ChurchInquiry();
        i.setCaseId(caseId);
        if (issueId != null) {
            CaseIssue issue = c.getIssues().stream().filter(x -> x.getId().equals(issueId)).findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "That issue is not part of this case"));
            i.setIssueId(issueId);
            if (issue.getDepartment() != null) i.setDepartmentId(issue.getDepartment().getId());
        }
        if (i.getDepartmentId() == null && actor.getRole() == Role.DEPARTMENT) i.setDepartmentId(CaseAccess.departmentId(actor));
        for (CaseParty p : c.getParties())
            if (p.getRole() == PartyRole.COMPLAINANT) { i.setChurchId(p.getPerson().getChurch().getId()); break; }
        i.setQuestion(question.trim());
        i.setAskedBy(actor.getUsername());
        ChurchInquiry saved = repo.save(i);
        events.save(new CaseEvent(caseId, issueId, EventType.NOTE, "Comment sent to the church: " + shorten(saved.getQuestion()), actor.getUsername()));
        List<AppUser> who = new ArrayList<>(users.findByRoleAndActiveTrue(Role.ADMIN));
        who.addAll(users.findByRoleAndActiveTrue(Role.RECEPTION));
        notifier.send(who, "INQUIRY", "Comment for the church · case " + code(c),
                "From " + actor.getFullName() + ": " + shorten(saved.getQuestion()) + " — send it to the church and record what they reply.", caseId, c.getCode(), actor.getUsername());
        return dto(saved, c);
    }

    /** The desk records what the church found and sent back. */
    @Transactional
    public InquiryDto recordFinding(Long id, String finding, AppUser actor) {
        if (finding == null || finding.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please write what the church found or replied");
        ChurchInquiry i = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        ChurchCase c = load(i.getCaseId());
        access.assertCanView(c, actor);
        i.setFinding(finding.trim()); i.setFindingBy(actor.getUsername()); i.setFindingAt(Instant.now());
        i.setStatus(ChurchInquiry.ANSWERED);
        i.setDecision(null); i.setChurchAgreed(null); i.setDecidedBy(null); i.setDecidedAt(null);
        events.save(new CaseEvent(c.getId(), i.getIssueId(), EventType.NOTE, "The church replied: " + shorten(i.getFinding()), actor.getUsername()));
        List<AppUser> who = new ArrayList<>(users.findByRoleAndActiveTrue(Role.ADMIN));
        users.findByUsername(i.getAskedBy()).ifPresent(who::add);
        notifier.send(who, "INQUIRY", "The church replied · case " + code(c), shorten(i.getFinding()) + " — waiting for the administrator's decision.",
                c.getId(), c.getCode(), actor.getUsername());
        return dto(i, c);
    }

    /** The administrator discusses the church's findings and decides; if the church does not agree, everyone is updated. */
    @Transactional
    public InquiryDto decide(Long id, String decision, boolean churchAgreed, AppUser actor) {
        if (actor.getRole() != Role.ADMIN) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the administrator can decide");
        if (decision == null || decision.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please write the decision");
        ChurchInquiry i = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        if (i.getFinding() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Record the church's findings first");
        ChurchCase c = load(i.getCaseId());
        i.setDecision(decision.trim()); i.setChurchAgreed(churchAgreed); i.setDecidedBy(actor.getUsername()); i.setDecidedAt(Instant.now());
        i.setStatus(churchAgreed ? ChurchInquiry.DECIDED : ChurchInquiry.DISPUTED);
        events.save(new CaseEvent(c.getId(), i.getIssueId(), EventType.NOTE,
                (churchAgreed ? "Decision (the church agreed): " : "Decision (the church did NOT agree): ") + shorten(i.getDecision()), actor.getUsername()));

        // update for all: the person who registered the case, the sender, the department, the desk and the admins
        List<AppUser> who = new ArrayList<>(users.findByRoleAndActiveTrue(Role.ADMIN));
        who.addAll(users.findByRoleAndActiveTrue(Role.RECEPTION));
        users.findByUsername(c.getCreatedBy()).ifPresent(who::add);
        users.findByUsername(i.getAskedBy()).ifPresent(who::add);
        if (i.getDepartmentId() != null) who.addAll(users.findByDepartmentIdAndActiveTrue(i.getDepartmentId()));
        notifier.send(who, churchAgreed ? "INQUIRY" : "INQUIRY_DISPUTED",
                (churchAgreed ? "Decision on the church reply · case " : "The church did not agree · case ") + code(c),
                shorten(i.getDecision()), c.getId(), c.getCode(), actor.getUsername());
        return dto(i, c);
    }

    // ---- helpers ----

    private ChurchCase load(Long id) {
        return cases.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
    }

    private InquiryDto dto(ChurchInquiry i, ChurchCase c) {
        String dept = i.getDepartmentId() == null ? null : departments.findById(i.getDepartmentId()).map(d -> d.getName()).orElse(null);
        String church = c.getParties().stream().filter(p -> p.getRole() == PartyRole.COMPLAINANT).findFirst()
                .map(p -> p.getPerson().getChurch().getName()).orElse("");
        String issueLabel = null;
        if (i.getIssueId() != null) for (int k = 0; k < c.getIssues().size(); k++)
            if (c.getIssues().get(k).getId().equals(i.getIssueId())) issueLabel = "Issue " + (k + 1) + " · " + c.getIssues().get(k).getCategory();
        List<CaseFileDto> req = new ArrayList<>(), fin = new ArrayList<>();
        for (CaseFile f : fileRepo.findByCaseIdOrderByUploadedAtDesc(c.getId())) {
            if (!i.getId().equals(f.getInquiryId())) continue;
            CaseFileDto d = new CaseFileDto(f.getId(), f.getIssueId(), f.getInquiryId(), f.getStage(), f.getOriginalName(), f.getContentType(), f.getSizeBytes(), f.getUploadedBy(), f.getUploadedAt());
            ("FINDING".equals(f.getStage()) ? fin : req).add(d);
        }
        return new InquiryDto(i.getId(), c.getId(), c.getCode(), i.getIssueId(), issueLabel, i.getDepartmentId(), dept, church, i.getStatus(), i.getQuestion(),
                i.getAskedBy(), i.getAskedAt(), i.getFinding(), i.getFindingBy(), i.getFindingAt(), i.getDecision(), i.getChurchAgreed(), i.getDecidedBy(), i.getDecidedAt(), req, fin);
    }

    private static String shorten(String s) { return s.length() > 160 ? s.substring(0, 157) + "…" : s; }
    private static String code(ChurchCase c) { return c.getCode().length() == 6 ? c.getCode().substring(0, 3) + "-" + c.getCode().substring(3) : c.getCode(); }
}
