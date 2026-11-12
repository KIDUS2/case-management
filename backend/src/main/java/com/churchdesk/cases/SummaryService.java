package com.churchdesk.cases;

import com.churchdesk.cases.InquiryService.InquiryDto;
import com.churchdesk.user.AppUser;
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

/** One page that sums up many cases at once (a busy week can bring 100), with the people and churches behind the numbers. */
@Service
public class SummaryService {
    private static final ZoneId ZONE = ZoneId.of("Africa/Addis_Ababa");
    private static final int CAP = 5000;

    public record Count(String name, long count) {}
    public record Day(String date, long count) {}
    public record Row(Long id, String code, List<String> complainants, List<String> subjects, String churchName, CaseStatus status,
                      int issueCount, int resolvedCount, List<IssueCategory> categories, List<String> departments, int openInquiries,
                      boolean letterIssued, Instant createdAt) {}
    public record Result(long cases, long issues, long issuesResolved, long letters, long withOpenInquiry, boolean truncated,
                         Map<String, Long> byStatus, Map<String, Long> byCategory, List<Count> byDepartment, List<Count> byChurch, List<Day> daily,
                         List<Row> rows, long total, int page, int size, List<InquiryDto> waitingForAdmin) {}

    private final ChurchCaseRepository cases;
    private final ChurchInquiryRepository inquiries;
    private final InquiryService inquiryService;
    private final AccessService access;

    public SummaryService(ChurchCaseRepository cases, ChurchInquiryRepository inquiries, InquiryService inquiryService, AccessService access) {
        this.cases = cases; this.inquiries = inquiries; this.inquiryService = inquiryService; this.access = access;
    }

    @Transactional(readOnly = true)
    public Result build(LocalDate from, LocalDate to, CaseStatus status, Long departmentId, String q, int page, int size, AppUser actor) {
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
        for (IssueCategory k : IssueCategory.values()) byCategory.put(k.name(), 0L);
        Map<String, Long> byDept = new TreeMap<>(), byChurch = new HashMap<>();
        Map<LocalDate, Long> perDay = new TreeMap<>();
        long issues = 0, resolved = 0, letters = 0, withOpen = 0;
        List<Row> rows = new ArrayList<>();

        for (ChurchCase c : all) {
            byStatus.merge(c.getStatus().name(), 1L, Long::sum);
            perDay.merge(c.getCreatedAt().atZone(ZONE).toLocalDate(), 1L, Long::sum);
            if (c.isLetterIssued()) letters++;
            List<String> comp = new ArrayList<>(), subj = new ArrayList<>();
            String church = "";
            for (CaseParty cp : c.getParties()) {
                if (cp.getRole() == PartyRole.COMPLAINANT) { comp.add(cp.getPerson().getFullName()); if (church.isEmpty()) church = cp.getPerson().getChurch().getName(); }
                else if (cp.getRole() == PartyRole.SUBJECT) subj.add(cp.getPerson().getFullName());
            }
            if (!church.isEmpty()) byChurch.merge(church, 1L, Long::sum);
            Set<String> depts = new TreeSet<>();
            Set<IssueCategory> cats = new LinkedHashSet<>();
            int done = 0;
            for (CaseIssue i : c.getIssues()) {
                issues++;
                byCategory.merge(i.getCategory().name(), 1L, Long::sum);
                cats.add(i.getCategory());
                if (i.getStatus() == IssueStatus.RESOLVED) { resolved++; done++; }
                if (i.getDepartment() != null) { depts.add(i.getDepartment().getName()); byDept.merge(i.getDepartment().getName(), 1L, Long::sum); }
            }
            int open = openByCase.getOrDefault(c.getId(), 0);
            if (open > 0) withOpen++;
            rows.add(new Row(c.getId(), c.getCode(), comp, subj, church, c.getStatus(), c.getIssues().size(), done, new ArrayList<>(cats),
                    new ArrayList<>(depts), open, c.isLetterIssued(), c.getCreatedAt()));
        }

        List<Count> topChurch = byChurch.entrySet().stream()
                .sorted((a, b) -> b.getValue() != a.getValue().longValue() ? Long.compare(b.getValue(), a.getValue()) : a.getKey().compareTo(b.getKey()))
                .limit(10).map(e -> new Count(e.getKey(), e.getValue())).toList();
        List<Count> deptList = byDept.entrySet().stream().map(e -> new Count(e.getKey(), e.getValue())).toList();
        List<Day> daily = perDay.entrySet().stream().map(e -> new Day(e.getKey().toString(), e.getValue())).toList();

        int sz = Math.min(Math.max(size, 1), 100), pg = Math.max(page, 0);
        int fromIdx = Math.min(pg * sz, rows.size()), toIdx = Math.min(fromIdx + sz, rows.size());
        return new Result(all.size(), issues, resolved, letters, withOpen, all.size() >= CAP, byStatus, byCategory, deptList, topChurch, daily,
                rows.subList(fromIdx, toIdx), rows.size(), pg, sz, inquiryService.waitingForAdmin(actor));
    }
}
