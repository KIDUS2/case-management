package com.churchdesk.report;

import com.churchdesk.cases.CaseStatus;
import com.churchdesk.cases.IssueCategory;
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
    public record Overview(Totals totals, Map<String, Long> byStatus, Map<String, Long> byCategory,
                           List<NameCount> topChurches, List<DayCount> daily) {}

    @PersistenceContext private EntityManager em;

    @Transactional(readOnly = true)
    public Overview overview() {
        long cases = count("select count(c) from ChurchCase c");
        long people = count("select count(p) from Person p");
        long returning = count("select count(p) from Person p where (select count(distinct cp.churchCase.id) from CaseParty cp where cp.person = p) > 1");
        long churches = count("select count(distinct ch.id) from CaseParty cp join cp.person p join p.church ch");
        long churchMembers = em.createQuery("select count(distinct cp.person.id) from CaseParty cp where cp.person.workingStatus = :ws", Long.class)
                .setParameter("ws", WorkingStatus.CHURCH_MEMBER).getSingleResult();
        long reportedOn = em.createQuery("select count(distinct cp.person.id) from CaseParty cp where cp.role = :role", Long.class)
                .setParameter("role", PartyRole.SUBJECT).getSingleResult();
        long repeatReportedOn = em.createQuery("select count(p) from Person p where (select count(distinct cp.churchCase.id) from CaseParty cp where cp.person = p and cp.role = :role) > 1", Long.class)
                .setParameter("role", PartyRole.SUBJECT).getSingleResult();
        long letters = count("select count(c) from ChurchCase c where c.letterIssued = true");

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (CaseStatus s : CaseStatus.values()) byStatus.put(s.name(), 0L);
        for (Object[] row : em.createQuery("select c.status, count(c) from ChurchCase c group by c.status", Object[].class).getResultList())
            byStatus.put(((CaseStatus) row[0]).name(), (Long) row[1]);

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (IssueCategory k : IssueCategory.values()) byCategory.put(k.name(), 0L);
        for (Object[] row : em.createQuery("select i.category, count(i) from CaseIssue i group by i.category", Object[].class).getResultList())
            byCategory.put(((IssueCategory) row[0]).name(), (Long) row[1]);

        List<NameCount> top = new ArrayList<>();
        for (Object[] row : em.createQuery(
                "select ch.name, count(distinct cp.churchCase.id) from CaseParty cp join cp.person p join p.church ch group by ch.name order by count(distinct cp.churchCase.id) desc, ch.name",
                Object[].class).setMaxResults(8).getResultList())
            top.add(new NameCount((String) row[0], (Long) row[1]));

        // cases per day for the last 30 days, zeros included so the chart has no gaps
        LocalDate today = LocalDate.now(ZONE);
        LocalDate first = today.minusDays(DAYS - 1);
        Instant since = first.atStartOfDay(ZONE).toInstant();
        Map<LocalDate, Long> perDay = new LinkedHashMap<>();
        for (int i = 0; i < DAYS; i++) perDay.put(first.plusDays(i), 0L);
        for (Instant at : em.createQuery("select c.createdAt from ChurchCase c where c.createdAt >= :since", Instant.class)
                .setParameter("since", since).getResultList())
            perDay.merge(at.atZone(ZONE).toLocalDate(), 1L, Long::sum);
        List<DayCount> daily = perDay.entrySet().stream().map(e -> new DayCount(e.getKey().toString(), e.getValue())).toList();

        return new Overview(new Totals(cases, people, returning, churches, letters, churchMembers, reportedOn, repeatReportedOn), byStatus, byCategory, top, daily);
    }

    private long count(String jpql) { return em.createQuery(jpql, Long.class).getSingleResult(); }
}
