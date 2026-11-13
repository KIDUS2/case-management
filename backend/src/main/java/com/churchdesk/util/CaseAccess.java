package com.churchdesk.util;

import com.churchdesk.enums.IssueStatus;
import com.churchdesk.enums.Role;
import com.churchdesk.model.AppUser;
import com.churchdesk.model.CaseIssue;
import com.churchdesk.model.Department;

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
