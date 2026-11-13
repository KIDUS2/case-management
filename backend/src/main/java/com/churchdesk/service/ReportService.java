package com.churchdesk.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.churchdesk.dto.common.DayCount;
import com.churchdesk.dto.common.NameCount;
import com.churchdesk.dto.response.DeptCount;
import com.churchdesk.dto.response.Flow;
import com.churchdesk.dto.response.Hotspot;
import com.churchdesk.dto.response.ReportOverview;
import com.churchdesk.dto.response.ReportTotals;
import com.churchdesk.enums.CaseStatus;
import com.churchdesk.enums.IssueStatus;
import com.churchdesk.enums.PartyRole;
import com.churchdesk.enums.WorkingStatus;
import com.churchdesk.model.CaseIssue;
import com.churchdesk.model.CaseParty;
import com.churchdesk.model.ChurchCase;
import com.churchdesk.model.Department;
import com.churchdesk.model.Person;
import com.churchdesk.util.Times;

@Service
public class ReportService {
    private static final ZoneId ZONE = ZoneId.of("Africa/Addis_Ababa");
    private static final int DAYS = 30;
    @Autowired private OptionService options;

    @PersistenceContext private EntityManager em;

    private static final Instant FOREVER = Instant.parse("3000-01-01T00:00:00Z");

    /** The numbers for cases registered from {@code from} to {@code to} (both days included); no dates means all time. */
    @Transactional(readOnly = true)
    public ReportOverview overview(LocalDate from, LocalDate to) {
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
        for (String k : options.issueTypeLabels().keySet()) byCategory.put(k, 0L);
        for (Object[] row : em.createQuery("select i.category, count(i) from CaseIssue i join i.churchCase cc where" + inRange + " group by i.category", Object[].class)
                .setParameter("s", s).setParameter("u", u).getResultList())
            byCategory.merge((String) row[0], (Long) row[1], Long::sum);

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

        List<Hotspot> bySub = hotspots(true, inRange, s, u, 0);
        List<Hotspot> byChurch = hotspots(false, inRange, s, u, 10);

        return new ReportOverview(new ReportTotals(cases, people, returning, churches, letters, churchMembers, reportedOn, repeatReportedOn),
                new Flow(expectedToday, overdue, courtOpen, waiting), byDept, byStatus, byCategory, top, daily, bySub, byChurch);
    }

    private List<Hotspot> hotspots(boolean bySubCity, String inRange, Instant s, Instant u, int limit) {
        record Acc(String sub, java.util.Set<Long> cases, long[] n, Map<String, Long> cats) {}
        Map<String, Acc> acc = new LinkedHashMap<>();
        for (Object[] r : em.createQuery("select ch.name, ch.subCity, cc.id, i.category, i.status from CaseIssue i join i.churchCase cc, CaseParty cp join cp.person p join p.church ch"
                + " where cp.churchCase = cc and cp.role = :role and" + inRange, Object[].class)
                .setParameter("role", PartyRole.COMPLAINANT).setParameter("s", s).setParameter("u", u).getResultList()) {
            String sub = r[1] == null || ((String) r[1]).isBlank() ? "—" : (String) r[1];
            String key = bySubCity ? sub : (String) r[0];
            Acc a = acc.computeIfAbsent(key, k -> new Acc(sub, new java.util.HashSet<>(), new long[2], new LinkedHashMap<>()));
            a.cases().add((Long) r[2]);
            a.n()[0]++;
            if (r[4] == IssueStatus.RESOLVED) a.n()[1]++;
            a.cats().merge((String) r[3], 1L, Long::sum);
        }
        return acc.entrySet().stream()
                .map(e -> new Hotspot(e.getKey(), e.getValue().sub(), e.getValue().cases().size(), e.getValue().n()[0], e.getValue().n()[1], e.getValue().cats()))
                .sorted((x, y) -> y.issues() != x.issues() ? Long.compare(y.issues(), x.issues()) : x.name().compareTo(y.name()))
                .limit(limit == 0 ? Long.MAX_VALUE : limit).toList();
    }

    private long count(String jpql, Instant s, Instant u) {
        return em.createQuery(jpql, Long.class).setParameter("s", s).setParameter("u", u).getSingleResult();
    }
}
