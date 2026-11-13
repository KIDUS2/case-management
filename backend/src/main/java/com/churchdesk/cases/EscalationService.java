package com.churchdesk.cases;

import com.churchdesk.notification.NotificationService;
import com.churchdesk.user.AppUser;
import com.churchdesk.user.Role;
import com.churchdesk.user.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Tells the administrator when a department keeps an issue past its date, and again as it stays unsolved. */
@Service
public class EscalationService {
    private final CaseIssueRepository issues;
    private final CaseEventRepository events;
    private final UserRepository users;
    private final NotificationService notifier;

    public EscalationService(CaseIssueRepository issues, CaseEventRepository events, UserRepository users, NotificationService notifier) {
        this.issues = issues; this.events = events; this.users = users; this.notifier = notifier;
    }

    @Scheduled(initialDelay = 60_000, fixedDelay = 3_600_000) @Transactional
    public void scheduled() { runOnce(); }

    /** Returns how many issues were escalated or re-escalated this time. */
    @Transactional
    public int runOnce() {
        LocalDate today = Times.today();
        int done = 0;
        for (CaseIssue i : issues.findAllInDepartments(IssueStatus.REFERRED)) {
            long late = Escalation.daysLate(i, today);
            int level = Escalation.levelFor(late);
            if (level <= i.getEscalationLevel()) continue;
            i.setEscalationLevel(level);
            i.setEscalatedAt(Instant.now());
            ChurchCase c = i.getChurchCase();
            String dept = i.getDepartment().getName();
            String code = c.getCode().length() == 6 ? c.getCode().substring(0, 3) + "-" + c.getCode().substring(3) : c.getCode();
            String msg = "Escalated to the administrator: " + dept + " has not solved this issue, " + late + (late == 1 ? " day" : " days") + " after the date"
                    + (i.getEscalationLevel() > 1 ? " (reminder " + i.getEscalationLevel() + ")" : "") + ".";
            events.save(new CaseEvent(c.getId(), i.getId(), EventType.NOTE, msg, "system"));
            List<AppUser> who = new ArrayList<>(users.findByRoleAndActiveTrue(Role.ADMIN));
            users.findByUsername(c.getCreatedBy()).ifPresent(who::add);
            notifier.send(who, "ESCALATION", dept + " is " + late + (late == 1 ? " day" : " days") + " late · case " + code,
                    "A " + i.getCategory().name().toLowerCase() + " issue was due " + Escalation.dueOn(i) + " and is still not solved.",
                    c.getId(), c.getCode(), "system");
            // the department is reminded too
            notifier.send(users.findByDepartmentIdAndActiveTrue(i.getDepartment().getId()), "ESCALATION", "Overdue · case " + code,
                    "This issue passed its date " + late + (late == 1 ? " day" : " days") + " ago. The administrator has been told.", c.getId(), c.getCode(), "system");
            done++;
        }
        return done;
    }
}
