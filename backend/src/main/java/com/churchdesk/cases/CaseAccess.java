package com.churchdesk.cases;

import com.churchdesk.user.AppUser;
import com.churchdesk.user.Role;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Who may see and act on what. Department staff only reach cases that have an issue sent to their own department. */
public final class CaseAccess {
    private CaseAccess() {}

    public static Long departmentId(AppUser u) { return u.getDepartment() == null ? null : u.getDepartment().getId(); }

    public static boolean canResolve(AppUser u, CaseIssue i) {
        if (u.getRole() == Role.ADMIN || u.getRole() == Role.OFFICER) return true;
        Long d = departmentId(u);
        return u.getRole() == Role.DEPARTMENT && d != null && i.getDepartment() != null
                && d.equals(i.getDepartment().getId()) && i.getStatus() == IssueStatus.REFERRED;
    }
}
