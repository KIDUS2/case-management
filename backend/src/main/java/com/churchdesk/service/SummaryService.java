package com.churchdesk.service;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import com.churchdesk.dto.common.DayCount;
import com.churchdesk.dto.common.NameCount;
import com.churchdesk.dto.response.Escalated;
import com.churchdesk.dto.response.LeaderRow;
import com.churchdesk.dto.response.SummaryResult;
import com.churchdesk.dto.response.SummaryRow;
import com.churchdesk.dto.response.SummarySubCityRow;
import com.churchdesk.enums.CaseStatus;
import com.churchdesk.enums.IssueStatus;
import com.churchdesk.enums.PartyRole;
import com.churchdesk.enums.WorkingStatus;
import com.churchdesk.model.AppUser;
import com.churchdesk.model.CaseIssue;
import com.churchdesk.model.CaseParty;
import com.churchdesk.model.ChurchCase;
import com.churchdesk.model.ChurchInquiry;
import com.churchdesk.model.Person;
import com.churchdesk.repository.ChurchCaseRepository;
import com.churchdesk.repository.ChurchInquiryRepository;
import com.churchdesk.util.Escalation;

/** One page that sums up many cases at once (a busy week can bring 100), with the people and churches behind the numbers. */
@Service
public class SummaryService {
    private static final ZoneId ZONE = ZoneId.of("Africa/Addis_Ababa");
    private static final int CAP = 5000;

    private final ChurchCaseRepository cases;
    private final ChurchInquiryRepository inquiries;
    private final InquiryService inquiryService;
    private final AccessService access;
    private final OptionService options;

    public SummaryService(ChurchCaseRepository cases, ChurchInquiryRepository inquiries, InquiryService inquiryService, AccessService access, OptionService options) {
        this.options = options; this.cases = cases; this.inquiries = inquiries; this.inquiryService = inquiryService; this.access = access;
    }

    @Transactional(readOnly = true)
    public SummaryResult build(LocalDate from, LocalDate to, CaseStatus status, Long departmentId, String q, int page, int size, AppUser actor) {
        if (from != null && to != null && to.isBefore(from)) { LocalDate x = from; from = to; to = x; }
        final Instant since = from == null ? null : from.atStartOfDay(ZONE).toInstant();
        final Instant until = to == null ? null : to.plusDays(1).atStartOfDay(ZONE).toInstant();
        final String like = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase() + "%";
        final String codePart = q == null ? "" : q.toUpperCase().replaceAll("[^A-Z0-9]", "");

        Specification<ChurchCase> spec = access.visibleTo(actor);
        spec = spec.and((root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (since != null) ps.add(cb.greaterThanOrEqualTo(root.<Instant>get("createdAt"), since));
            if (until != null) ps.add(cb.lessThan(root.<Instant>get("createdAt"), until));
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (departmentId != null || like != null) query.distinct(true);
            if (departmentId != null) {
                Join<ChurchCase, CaseIssue> i = root.join("issues", JoinType.INNER);
                ps.add(cb.equal(i.get("department").get("id"), departmentId));
            }
            if (like != null) {
                Join<ChurchCase, CaseParty> cp = root.join("parties", JoinType.LEFT);
                Join<CaseParty, Person> p = cp.join("person", JoinType.LEFT);
                Predicate byText = cb.or(cb.like(cb.lower(p.<String>get("fullName")), like),
                        cb.like(cb.lower(p.join("church", JoinType.LEFT).<String>get("name")), like));
                ps.add(codePart.isEmpty() ? byText : cb.or(byText, cb.like(root.<String>get("code"), "%" + codePart + "%")));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        });

        List<ChurchCase> all = cases.findAll(spec, PageRequest.of(0, CAP, Sort.by(Sort.Direction.DESC, "id"))).getContent();

        Map<Long, Integer> openByCase = new HashMap<>();
        for (ChurchInquiry i : inquiries.findByStatusInOrderByAskedAtDesc(List.of(ChurchInquiry.OPEN, ChurchInquiry.ANSWERED, ChurchInquiry.DISPUTED)))
            openByCase.merge(i.getCaseId(), 1, Integer::sum);

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (CaseStatus s : CaseStatus.values()) byStatus.put(s.name(), 0L);
        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (String k : options.issueTypeLabels().keySet()) byCategory.put(k, 0L);
        Map<String, Long> byDept = new TreeMap<>(), byChurch = new HashMap<>();
        Map<LocalDate, Long> perDay = new TreeMap<>();
        long issues = 0, resolved = 0, letters = 0, withOpen = 0, late = 0, urgent = 0;
        List<SummaryRow> rows = new ArrayList<>();
        Map<String, long[]> subTotals = new HashMap<>();              // cases, issues, resolved
        Map<String, Map<String, Long>> subCats = new HashMap<>();
        List<Escalated> escalations = new ArrayList<>();
        List<LeaderRow> leaders = new ArrayList<>();
        LocalDate today = LocalDate.now(ZONE);

        for (ChurchCase c : all) {
            byStatus.merge(c.getStatus().name(), 1L, Long::sum);
            perDay.merge(c.getCreatedAt().atZone(ZONE).toLocalDate(), 1L, Long::sum);
            if (c.isLetterIssued()) letters++;
            List<String> comp = new ArrayList<>(), subj = new ArrayList<>();
            String church = "", sub = null;
            for (CaseParty cp : c.getParties()) {
                if (cp.getRole() == PartyRole.COMPLAINANT) {
                    comp.add(cp.getPerson().getFullName());
                    if (church.isEmpty()) { church = cp.getPerson().getChurch().getName(); sub = cp.getPerson().getChurch().getSubCity(); }
                }
                else if (cp.getRole() == PartyRole.SUBJECT) subj.add(cp.getPerson().getFullName());
            }
            if (!church.isEmpty()) byChurch.merge(church, 1L, Long::sum);
            Set<String> depts = new TreeSet<>();
            Set<String> cats = new LinkedHashSet<>();
            int done = 0;
            String subKey = sub == null || sub.isBlank() ? "—" : sub;
            long[] st = subTotals.computeIfAbsent(subKey, k -> new long[3]);
            st[0]++;
            Map<String, Long> sc = subCats.computeIfAbsent(subKey, k -> new LinkedHashMap<>());
            for (CaseIssue i : c.getIssues()) {
                issues++; st[1]++;
                sc.merge(i.getCategory(), 1L, Long::sum);
                if (i.isUrgent() && i.getStatus() != IssueStatus.RESOLVED) urgent++;
                long dl = Escalation.daysLate(i, today);
                if (dl > 0) {
                    late++;
                    escalations.add(new Escalated(c.getId(), c.getCode(), i.getDepartment().getName(), i.getCategory(), church, sub, dl, i.getEscalationLevel(), i.isUrgent()));
                }
                if (i.getStatus() == IssueStatus.RESOLVED) st[2]++;
                byCategory.merge(i.getCategory(), 1L, Long::sum);
                cats.add(i.getCategory());
                if (i.getStatus() == IssueStatus.RESOLVED) { resolved++; done++; }
                if (i.getDepartment() != null) { depts.add(i.getDepartment().getName()); byDept.merge(i.getDepartment().getName(), 1L, Long::sum); }
            }
            int open = openByCase.getOrDefault(c.getId(), 0);
            if (open > 0) withOpen++;
            for (CaseParty cp : c.getParties()) {
                if (cp.getPerson().getWorkingStatus() == WorkingStatus.LEADER_PRIEST && leaders.size() < 200)
                    leaders.add(new LeaderRow(c.getId(), c.getCode(), cp.getPerson().getFullName(), cp.getRole() == PartyRole.SUBJECT ? "SUBJECT" : "COMPLAINANT",
                            cp.getPerson().getChurch().getName(), cp.getPerson().getChurch().getSubCity(), c.getStatus(), new ArrayList<>(cats), c.getIssues().size(), done, c.getCreatedAt()));
            }
            rows.add(new SummaryRow(c.getId(), c.getCode(), comp, subj, church, sub, c.getStatus(), c.getIssues().size(), done, new ArrayList<>(cats),
                    new ArrayList<>(depts), open, c.isLetterIssued(), c.getCreatedAt()));
        }

        List<NameCount> topChurch = byChurch.entrySet().stream()
                .sorted((a, b) -> b.getValue() != a.getValue().longValue() ? Long.compare(b.getValue(), a.getValue()) : a.getKey().compareTo(b.getKey()))
                .limit(10).map(e -> new NameCount(e.getKey(), e.getValue())).toList();
        List<NameCount> deptList = byDept.entrySet().stream().map(e -> new NameCount(e.getKey(), e.getValue())).toList();
        List<DayCount> daily = perDay.entrySet().stream().map(e -> new DayCount(e.getKey().toString(), e.getValue())).toList();

        List<SummarySubCityRow> subCities = subTotals.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[1], a.getValue()[1]))
                .map(e -> new SummarySubCityRow(e.getKey(), e.getValue()[0], e.getValue()[1], e.getValue()[2], subCats.get(e.getKey()))).toList();
        escalations.sort((a, b) -> Long.compare(b.daysLate(), a.daysLate()));
        if (escalations.size() > 50) escalations = new ArrayList<>(escalations.subList(0, 50));

        int sz = Math.min(Math.max(size, 1), 100), pg = Math.max(page, 0);
        int fromIdx = Math.min(pg * sz, rows.size()), toIdx = Math.min(fromIdx + sz, rows.size());
        return new SummaryResult(all.size(), issues, resolved, letters, withOpen, late, urgent, all.size() >= CAP, subCities, escalations, leaders, byStatus, byCategory, deptList, topChurch, daily,
                rows.subList(fromIdx, toIdx), rows.size(), pg, sz, inquiryService.waitingForAdmin(actor));
    }
}
