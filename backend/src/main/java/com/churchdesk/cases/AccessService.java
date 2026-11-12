package com.churchdesk.cases;

import com.churchdesk.user.AppUser;
import com.churchdesk.user.Role;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Who may open a case. The admin and anyone with the "see all cases" privilege can open every case.
 * Everyone else only opens cases they registered, cases the admin added them to, and (department staff)
 * cases with an issue sent to their department.
 */
@Component
public class AccessService {
    private final CaseGrantRepository grants;
    public AccessService(CaseGrantRepository grants) { this.grants = grants; }

    public boolean seesEverything(AppUser u) { return u.getRole() == Role.ADMIN || u.isCanViewAll(); }

    public boolean canView(ChurchCase c, AppUser u) {
        if (seesEverything(u)) return true;
        if (u.getUsername().equals(c.getCreatedBy())) return true;
        Long d = CaseAccess.departmentId(u);
        if (u.getRole() == Role.DEPARTMENT && d != null
                && c.getIssues().stream().anyMatch(i -> i.getDepartment() != null && d.equals(i.getDepartment().getId()))) return true;
        return grants.existsByCaseIdAndUserId(c.getId(), u.getId());
    }

    public void assertCanView(ChurchCase c, AppUser u) {
        if (!canView(c, u))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this case. Ask the administrator to add you to it.");
    }

    /** The same rule as canView, for lists and counts. */
    public Specification<ChurchCase> visibleTo(AppUser u) {
        if (seesEverything(u)) return (root, query, cb) -> cb.conjunction();
        final Long uid = u.getId();
        final String username = u.getUsername();
        final Long dept = u.getRole() == Role.DEPARTMENT ? CaseAccess.departmentId(u) : null;
        return (root, query, cb) -> {
            Subquery<Long> granted = query.subquery(Long.class);
            Root<CaseGrant> g = granted.from(CaseGrant.class);
            granted.select(g.<Long>get("caseId")).where(cb.equal(g.get("userId"), uid));
            Predicate p = cb.or(cb.equal(root.get("createdBy"), username), root.get("id").in(granted));
            if (dept != null) {
                Subquery<Long> sent = query.subquery(Long.class);
                Root<CaseIssue> i = sent.from(CaseIssue.class);
                sent.select(i.get("churchCase").<Long>get("id")).where(cb.equal(i.get("department").get("id"), dept));
                p = cb.or(p, root.get("id").in(sent));
            }
            return p;
        };
    }
}
