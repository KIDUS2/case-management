package com.churchdesk.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import com.churchdesk.dto.request.SubcityReferralRequest;
import com.churchdesk.dto.response.SubcityReferralDto;
import com.churchdesk.enums.EventType;
import com.churchdesk.enums.Role;
import com.churchdesk.model.AppUser;
import com.churchdesk.model.CaseEvent;
import com.churchdesk.model.ChurchCase;
import com.churchdesk.model.SubcityReferral;
import com.churchdesk.repository.CaseEventRepository;
import com.churchdesk.repository.ChurchCaseRepository;
import com.churchdesk.repository.SubcityReferralRepository;
import com.churchdesk.repository.UserRepository;

/** The diocese sends a case to a sub-city. The sub-city sends its solution back to the diocese. */
@Service
public class SubcityReferralService {
    private final SubcityReferralRepository repo;
    private final ChurchCaseRepository cases;
    private final CaseEventRepository events;
    private final UserRepository users;
    private final NotificationService notifier;
    private final AccessService access;
    private final OptionService options;

    public SubcityReferralService(SubcityReferralRepository repo, ChurchCaseRepository cases, CaseEventRepository events,
                                  UserRepository users, NotificationService notifier, AccessService access, OptionService options) {
        this.repo = repo; this.cases = cases; this.events = events; this.users = users; this.notifier = notifier; this.access = access; this.options = options;
    }

    @Transactional
    public SubcityReferralDto send(Long caseId, SubcityReferralRequest r, AppUser actor) {
        if (!actor.getRole().isDiocese()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the diocese can send a case to a sub-city");
        ChurchCase c = load(caseId);
        SubcityReferral s = new SubcityReferral();
        s.setCaseId(c.getId());
        if (r.issueId() != null) {
            if (c.getIssues().stream().noneMatch(i -> r.issueId().equals(i.getId())))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That issue is not part of this case");
            s.setIssueId(r.issueId());
        }
        s.setSubCity(options.requireSubCity(r.subCity()));
        s.setInstruction(r.instruction().trim());
        s.setSentBy(actor.getUsername());
        s = repo.save(s);
        events.save(new CaseEvent(c.getId(), s.getIssueId(), EventType.SUBCITY_REFERRAL, "Sent to the " + s.getSubCity() + " sub-city. " + s.getInstruction(), actor.getUsername()));
        List<AppUser> who = new ArrayList<>(users.findByRoleAndSubCityAndActiveTrue(Role.SUBCITY, s.getSubCity()));
        if (who.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active account exists for the " + s.getSubCity() + " sub-city yet. Create one in Users first.");
        notifier.send(who, "SUBCITY_REFERRAL", "A case was sent to " + s.getSubCity(), "Case " + code(c) + " — " + s.getInstruction(), c.getId(), c.getCode(), actor.getUsername());
        return toDto(s, c);
    }

    @Transactional
    public SubcityReferralDto solve(Long id, String text, AppUser actor) {
        SubcityReferral s = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        boolean ownSubCity = actor.getRole() == Role.SUBCITY && s.getSubCity().equals(actor.getSubCity());
        if (!ownSubCity && !actor.getRole().isDiocese())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the " + s.getSubCity() + " sub-city can send this solution");
        if ("CLOSED".equals(s.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "The diocese already closed this");
        ChurchCase c = load(s.getCaseId());
        s.setSolution(text.trim());
        s.setRepliedBy(actor.getUsername());
        s.setRepliedAt(Instant.now());
        s.setStatus("REPLIED");
        events.save(new CaseEvent(c.getId(), s.getIssueId(), EventType.SUBCITY_REFERRAL, "Solution from the " + s.getSubCity() + " sub-city: " + s.getSolution(), actor.getUsername()));
        List<AppUser> who = new ArrayList<>(users.findByRoleAndActiveTrue(Role.ADMIN));
        who.addAll(users.findByRoleAndActiveTrue(Role.OFFICER));
        who.addAll(users.findByRoleAndActiveTrue(Role.SERA_ASKIYAJIE));
        users.findByUsername(s.getSentBy()).ifPresent(who::add);
        notifier.send(who, "SUBCITY_REPLY", s.getSubCity() + " sent its solution · case " + code(c), s.getSolution(), c.getId(), c.getCode(), actor.getUsername());
        return toDto(s, c);
    }

    @Transactional
    public SubcityReferralDto close(Long id, AppUser actor) {
        if (!actor.getRole().isDiocese()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the diocese can close this");
        SubcityReferral s = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        ChurchCase c = load(s.getCaseId());
        s.setStatus("CLOSED");
        events.save(new CaseEvent(c.getId(), s.getIssueId(), EventType.SUBCITY_REFERRAL, "Sub-city referral closed", actor.getUsername()));
        return toDto(s, c);
    }

    @Transactional(readOnly = true)
    public List<SubcityReferralDto> forCase(Long caseId, AppUser actor) {
        ChurchCase c = load(caseId);
        access.assertCanView(c, actor);
        return repo.findByCaseIdOrderByIdDesc(caseId).stream()
                .filter(s -> actor.getRole() != Role.SUBCITY || s.getSubCity().equals(actor.getSubCity()))
                .map(s -> toDto(s, c)).toList();
    }

    /** A sub-city sees what was sent to it; the diocese sees the solutions waiting to be read. */
    @Transactional(readOnly = true)
    public List<SubcityReferralDto> waiting(AppUser actor) {
        List<SubcityReferral> list = actor.getRole() == Role.SUBCITY
                ? (actor.getSubCity() == null ? List.of() : repo.findBySubCityAndStatusOrderByIdDesc(actor.getSubCity(), "SENT"))
                : actor.getRole().isDiocese() ? repo.findAll().stream().filter(s -> "REPLIED".equals(s.getStatus())).toList() : List.of();
        return list.stream().map(s -> toDto(s, load(s.getCaseId()))).toList();
    }

    private SubcityReferralDto toDto(SubcityReferral s, ChurchCase c) {
        return new SubcityReferralDto(s.getId(), c.getId(), c.getCode(), s.getIssueId(), s.getSubCity(), s.getInstruction(), s.getStatus(),
                s.getSentBy(), s.getSentAt(), s.getSolution(), s.getRepliedBy(), s.getRepliedAt());
    }

    private ChurchCase load(Long id) { return cases.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found")); }
    private static String code(ChurchCase c) { return c.getCode().length() == 6 ? c.getCode().substring(0, 3) + "-" + c.getCode().substring(3) : c.getCode(); }
}
