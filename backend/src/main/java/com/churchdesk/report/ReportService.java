package com.churchdesk.report;

import com.churchdesk.cases.CaseStatus;
import com.churchdesk.cases.IssueCategory;
import com.churchdesk.cases.IssueStatus;
import com.churchdesk.cases.Times;
import com.churchdesk.cases.PartyRole;
import com.churchdesk.cases.WorkingStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {
    private static final ZoneId ZONE = ZoneId.of("Africa/Addis_Ababa");
    private static final int DAYS = 30;

    public record NameCount(String name, long count) {}
    public record DayCount(String date, long count) {}
    public record Totals(long cases, long people, long returningPeople, long churches, long letters,
                         long churchMembers, long reportedOn, long repeatReportedOn) {}
    /** Work still to do: people expected at the door, and court cases the admin has not yet acknowledged. */
    public record Flow(long expectedToday, long overdue, long courtUnacknowledged, long waitingInDepartments) {}
    public record DeptCount(String name, long pending, long resolved) {}
    public record Overview(Totals totals, Flow flow, List<DeptCount> byDepartment, Map<String, Long> byStatus, Map<String, Long> byCategory,
                           List<NameCount> topChurches, List<DayCount> daily) {}

    @PersistenceContext private EntityManager em;

    private static final Instant FOREVER = Instant.parse("3000-01-01T00:00:00Z");

    /** The numbers for cases registered from {@code from} to {@code to} (both days included); no dates means all time. */
    @Transactional(readOnly = true)
    public Overview overview(LocalDate from, LocalDate to) {
        if (from != null && to != null && to.isBefore(from)) { LocalDate x = from; from = to; to = x; }
        final Instant s = from == null ? Instant.EPOCH : from.atStartOfDay(ZONE).toInstant();
        final Instant u = to == null ? FOREVER : to.plusDays(1).atStartOfDay(ZONE).toInstant();
        final String inRange = " cc.createdAt >= :s and cc.createdAt < :u";

        long cases = count("select count(cc) from ChurchCase cc where" + inRange, s, u);
        long people = count("select count(distinct cp.person.id) from CaseParty cp join cp.churchCase cc where" + inRange, s, u);
        long returning = count("select count(p) from Person p where (select count(distinct cp.churchCase.id) from CaseParty cp join cp.churchCase cc where cp.person = p and" + inRange + ") > 1", s, u);
        long churches = count("select count(distinct ch.id) from CaseParty cp join cp.churchCase cc join cp.person p join p.church ch where" + inRange, s, u);
        long churchMembers = em.createQuery("select count(distinct cp.person.id) from CaseParty cp join cp.churchCase cc where cp.person.workingStatus = :ws and" + inRange, Long.class)
                .setParameter("ws", WorkingStatus.CHURCH_MEMBER).setParameter("s", s).setParameter("u", u).getSingleResult();
        long reportedOn = em.createQuery("select count(distinct cp.person.id) from CaseParty cp join cp.churchCase cc where cp.role = :role and" + inRange, Long.class)
                .setParameter("role", PartyRole.SUBJECT).setParameter("s", s).setParameter("u", u).getSingleResult();
        long repeatReportedOn = em.createQuery("select count(p) from Person p where (select count(distinct cp.churchCase.id) from CaseParty cp join cp.churchCase cc where cp.person = p and cp.role = :role and" + inRange + ") > 1", Long.class)
                .setParameter("role", PartyRole.SUBJECT).setParameter("s", s).setParameter("u", u).getSingleResult();
        long letters = count("select count(cc) from ChurchCase cc where cc.letterIssued = true and" + inRange, s, u);

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (CaseStatus st : CaseStatus.values()) byStatus.put(st.name(), 0L);
        for (Object[] row : em.createQuery("select cc.status, count(cc) from ChurchCase cc where" + inRange + " group by cc.status", Object[].class)
                .setParameter("s", s).setParameter("u", u).getResultList())
            byStatus.put(((CaseStatus) row[0]).name(), (Long) row[1]);

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (IssueCategory k : IssueCategory.values()) byCategory.put(k.name(), 0L);
        for (Object[] row : em.createQuery("select i.category, count(i) from CaseIssue i join i.churchCase cc where" + inRange + " group by i.category", Object[].class)
                .setParameter("s", s).setParameter("u", u).getResultList())
            byCategory.put(((IssueCategory) row[0]).name(), (Long) row[1]);

        List<NameCount> top = new ArrayList<>();
        for (Object[] row : em.createQuery(
                "select ch.name, count(distinct cc.id) from CaseParty cp join cp.churchCase cc join cp.person p join p.church ch where" + inRange
                        + " group by ch.name order by count(distinct cc.id) desc, ch.name", Object[].class)
                .setParameter("s", s).setParameter("u", u).setMaxResults(8).getResultList())
            top.add(new NameCount((String) row[0], (Long) row[1]));

        // cases per day, zeros included so the chart has no gaps. All time shows the last 30 days; a range shows the range (at most a year).
        LocalDate today = LocalDate.now(ZONE);
        LocalDate last = to != null && to.isBefore(today) ? to : today;
        LocalDate first = from != null ? from : last.minusDays(DAYS - 1);
        if (first.isAfter(last)) first = last;
        if (last.toEpochDay() - first.toEpochDay() > 365) first = last.minusDays(365);
        Instant since = first.atStartOfDay(ZONE).toInstant();
        Instant until = last.plusDays(1).atStartOfDay(ZONE).toInstant();
        Map<LocalDate, Long> perDay = new LinkedHashMap<>();
        for (LocalDate d = first; !d.isAfter(last); d = d.plusDays(1)) perDay.put(d, 0L);
        for (Instant at : em.createQuery("select cc.createdAt from ChurchCase cc where cc.createdAt >= :since and cc.createdAt < :until", Instant.class)
                .setParameter("since", since).setParameter("until", until).getResultList())
            perDay.merge(at.atZone(ZONE).toLocalDate(), 1L, Long::sum);
        List<DayCount> daily = perDay.entrySet().stream().map(e -> new DayCount(e.getKey().toString(), e.getValue())).toList();

        // what is waiting right now does not depend on the period
        LocalDate day = Times.today();
        long expectedToday = em.createQuery("select count(distinct i.churchCase.id) from CaseIssue i where i.returnOn = :d and i.status <> :r", Long.class)
                .setParameter("d", day).setParameter("r", IssueStatus.RESOLVED).getSingleResult();
        long overdue = em.createQuery("select count(distinct i.churchCase.id) from CaseIssue i where i.returnOn < :d and i.status <> :r", Long.class)
                .setParameter("d", day).setParameter("r", IssueStatus.RESOLVED).getSingleResult();
        long courtOpen = em.createQuery("select count(i) from CaseIssue i where i.courtAt is not null and i.courtAckAt is null", Long.class).getSingleResult();
        long waiting = em.createQuery("select count(i) from CaseIssue i where i.status = :s", Long.class)
                .setParameter("s", IssueStatus.REFERRED).getSingleResult();

        Map<String, long[]> dept = new LinkedHashMap<>();
        for (String name : em.createQuery("select d.name from Department d where d.active = true order by d.name", String.class).getResultList())
            dept.put(name, new long[]{0, 0});
        for (Object[] row : em.createQuery("select d.name, i.status, count(i) from CaseIssue i join i.department d join i.churchCase cc where" + inRange + " group by d.name, i.status", Object[].class)
                .setParameter("s", s).setParameter("u", u).getResultList()) {
            long[] v = dept.computeIfAbsent((String) row[0], k -> new long[]{0, 0});
            if (row[1] == IssueStatus.RESOLVED) v[1] += (Long) row[2]; else v[0] += (Long) row[2];
        }
        List<DeptCount> byDept = dept.entrySet().stream().map(e -> new DeptCount(e.getKey(), e.getValue()[0], e.getValue()[1])).toList();

        return new Overview(new Totals(cases, people, returning, churches, letters, churchMembers, reportedOn, repeatReportedOn),
                new Flow(expectedToday, overdue, courtOpen, waiting), byDept, byStatus, byCategory, top, daily);
    }

    private long count(String jpql, Instant s, Instant u) {
        return em.createQuery(jpql, Long.class).setParameter("s", s).setParameter("u", u).getSingleResult();
    }
}
