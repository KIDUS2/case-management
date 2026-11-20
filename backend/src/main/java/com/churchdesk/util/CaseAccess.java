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
        if (u.getRole() == Role.ADMIN || u.getRole() == Role.OFFICER || u.getRole() == Role.PAPAS) return true;
        if (u.getRole() == Role.SERA_ASKIYAJIE) return i.getHandlerLevel() <= 1;
        Long d = departmentId(u);
        // once an issue is passed up, the department can no longer close it
        return u.getRole() == Role.DEPARTMENT && d != null && i.getDepartment() != null
                && d.equals(i.getDepartment().getId()) && i.getStatus() == IssueStatus.REFERRED && i.getHandlerLevel() == 0;
    }
}
