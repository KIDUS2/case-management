package com.churchdesk.cases;

import com.churchdesk.notification.NotificationService;
import com.churchdesk.user.AppUser;
import com.churchdesk.user.CurrentUser;
import com.churchdesk.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.List;

/** The admin decides who else may open a case. */
@RestController
@RequestMapping("/api/cases/{caseId}/access")
@PreAuthorize("hasRole('ADMIN')")
public class CaseAccessController {
    public record GrantDto(Long userId, String fullName, String username, String role, String grantedBy, Instant grantedAt) {}
    public record GrantRequest(@NotNull Long userId) {}

    private final CaseGrantRepository grants;
    private final ChurchCaseRepository cases;
    private final UserRepository users;
    private final CaseEventRepository events;
    private final NotificationService notifier;
    private final CurrentUser current;

    public CaseAccessController(CaseGrantRepository grants, ChurchCaseRepository cases, UserRepository users,
                                CaseEventRepository events, NotificationService notifier, CurrentUser current) {
        this.grants = grants; this.cases = cases; this.users = users; this.events = events; this.notifier = notifier; this.current = current;
    }

    @GetMapping @Transactional(readOnly = true)
    public List<GrantDto> list(@PathVariable Long caseId) {
        return grants.findByCaseIdOrderByGrantedAtAsc(caseId).stream().map(g -> users.findById(g.getUserId())
                .map(u -> new GrantDto(u.getId(), u.getFullName(), u.getUsername(), u.getRole().name(), g.getGrantedBy(), g.getGrantedAt()))
                .orElse(null)).filter(x -> x != null).toList();
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED) @Transactional
    public List<GrantDto> add(@PathVariable Long caseId, @Valid @RequestBody GrantRequest r, Authentication auth) {
        AppUser admin = current.get(auth);
        ChurchCase c = cases.findById(caseId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
        AppUser u = users.findById(r.userId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));
        if (!grants.existsByCaseIdAndUserId(caseId, u.getId())) {
            CaseGrant g = new CaseGrant();
            g.setCaseId(caseId); g.setUserId(u.getId()); g.setGrantedBy(admin.getUsername());
            grants.save(g);
            events.save(new CaseEvent(caseId, null, EventType.NOTE, "Access given to " + u.getFullName(), admin.getUsername()));
            notifier.send(List.of(u), "ACCESS", "You were added to case " + c.getCode(), "You can now open this case.", caseId, c.getCode(), admin.getUsername());
        }
        return list(caseId);
    }

    @DeleteMapping("/{userId}") @Transactional
    public List<GrantDto> remove(@PathVariable Long caseId, @PathVariable Long userId, Authentication auth) {
        grants.findByCaseIdAndUserId(caseId, userId).ifPresent(g -> {
            grants.delete(g);
            String name = users.findById(userId).map(AppUser::getFullName).orElse("a user");
            events.save(new CaseEvent(caseId, null, EventType.NOTE, "Access removed from " + name, auth.getName()));
        });
        return list(caseId);
    }
}
