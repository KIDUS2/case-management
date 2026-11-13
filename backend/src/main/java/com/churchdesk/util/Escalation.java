package com.churchdesk.util;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import com.churchdesk.enums.IssueStatus;
import com.churchdesk.model.CaseIssue;

/** When an issue sent to a department is late. The due date is the return date if there is one, otherwise a week after it was sent. */
public final class Escalation {
    public static final int DEFAULT_DAYS = 7;
    /** After the first alert, the administrator is reminded again every this many days. */
    public static final int REMIND_EVERY = 3;
    private Escalation() {}

    public static LocalDate dueOn(CaseIssue i) {
        if (i.getReturnOn() != null) return i.getReturnOn();
        if (i.getReferredAt() == null) return null;
        return i.getReferredAt().atZone(Times.ZONE).toLocalDate().plusDays(DEFAULT_DAYS);
    }

    /** 0 when not late, resolved, or not in a department. */
    public static long daysLate(CaseIssue i, LocalDate today) {
        if (i.getStatus() != IssueStatus.REFERRED || i.getDepartment() == null) return 0;
        LocalDate due = dueOn(i);
        return due == null ? 0 : Math.max(0, ChronoUnit.DAYS.between(due, today));
    }

    /** 1 on the first late day, 2 after {@link #REMIND_EVERY} more days, and so on. */
    public static int levelFor(long daysLate) { return daysLate <= 0 ? 0 : 1 + (int) (daysLate / REMIND_EVERY); }
}
