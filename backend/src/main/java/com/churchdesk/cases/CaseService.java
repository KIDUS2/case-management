package com.churchdesk.cases;

import com.churchdesk.cases.CaseDtos.*;
import com.churchdesk.church.Church;
import com.churchdesk.church.ChurchRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.security.SecureRandom;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class CaseService {
    private static final List<CaseStatus> ACTIVE = List.of(CaseStatus.OPEN, CaseStatus.REFERRED, CaseStatus.COURT);
    /** No 0/O or 1/I so a code is easy to say and write down. */
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;

    private final ChurchCaseRepository cases;
    private final CasePartyRepository partyRepo;
    private final PersonRepository persons;
    private final ChurchRepository churches;
    private final SecureRandom random = new SecureRandom();

    public CaseService(ChurchCaseRepository cases, CasePartyRepository partyRepo, PersonRepository persons, ChurchRepository churches) {
        this.cases = cases; this.partyRepo = partyRepo; this.persons = persons; this.churches = churches;
    }

    @Transactional
    public CaseDetail create(CreateCaseRequest r, String username) {
        ChurchCase c = new ChurchCase();
        c.setCode(newCode());
        c.setDiscussionNotes(blankToNull(r.discussionNotes()));
        c.setLetterIssued(r.letterIssued());
        c.setCreatedBy(username);

        Set<String> seen = new HashSet<>();
        int order = 0;
        for (PartyIn in : r.complainants()) order = addParty(c, in, PartyRole.COMPLAINANT, order, seen);
        if (r.subjects() != null) {
            for (PartyIn in : r.subjects()) order = addParty(c, in, PartyRole.SUBJECT, order, seen);
        }

        int issueOrder = 0;
        for (IssueIn in : r.issues()) {
            CaseIssue i = new CaseIssue();
            i.setChurchCase(c);
            i.setCategory(in.category());
            i.setDescription(blankToNull(in.description()));
            i.setSortOrder(issueOrder++);
            c.getIssues().add(i);
        }
        c = cases.save(c);
        return toDetail(c);
    }

    /** The same person at the same church is reused, so all their cases are linked together. */
    private int addParty(ChurchCase c, PartyIn in, PartyRole role, int order, Set<String> seen) {
        Church church = churches.findById(in.churchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a church from the list for " + in.fullName().trim()));
        String name = in.fullName().trim();
        Person person = persons.findFirstByFullNameIgnoreCaseAndChurchId(name, church.getId()).orElseGet(Person::new);
        person.setFullName(name);
        person.setChurch(church);
        person.setWorkingStatus(in.workingStatus());
        if (in.phone() != null && !in.phone().isBlank()) person.setPhone(in.phone().trim());
        person = persons.save(person);

        if (!seen.add(person.getId() + ":" + role)) return order; // same person listed twice in the same role
        CaseParty p = new CaseParty();
        p.setChurchCase(c);
        p.setPerson(person);
        p.setRole(role);
        p.setSortOrder(order);
        c.getParties().add(p);
        return order + 1;
    }

    private String newCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
            String code = sb.toString();
            if (!cases.existsByCode(code)) return code;
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not make a case code, please try again");
    }

    @Transactional(readOnly = true)
    public PageDto<CaseSummary> list(String q, CaseStatus status, int page, int size) {
        Specification<ChurchCase> spec = (root, query, cb) -> cb.conjunction();
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (q != null && !q.isBlank()) {
            final String like = "%" + q.trim().toLowerCase() + "%";
            final String codePart = normalizeCode(q);
            spec = spec.and((root, query, cb) -> {
                query.distinct(true);
                Join<ChurchCase, CaseParty> cp = root.join("parties", JoinType.LEFT);
                Join<CaseParty, Person> p = cp.join("person", JoinType.LEFT);
                Join<Person, Church> ch = p.join("church", JoinType.LEFT);
                Predicate byText = cb.or(
                        cb.like(cb.lower(p.<String>get("fullName")), like),
                        cb.like(cb.lower(ch.<String>get("name")), like));
                if (codePart.isEmpty()) return byText;
                return cb.or(byText, cb.like(root.<String>get("code"), "%" + codePart + "%"));
            });
        }
        Page<ChurchCase> result = cases.findAll(spec, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "id")));
        return new PageDto<>(result.getContent().stream().map(this::toSummary).toList(),
                result.getTotalElements(), result.getNumber(), result.getSize());
    }

    @Transactional(readOnly = true)
    public CaseDetail get(Long id) {
        return toDetail(cases.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found")));
    }

    /** Staff type the short code (dashes and spaces are ignored) to open a case. */
    @Transactional(readOnly = true)
    public CaseDetail getByCode(String code) {
        return toDetail(cases.findByCode(normalizeCode(code))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No case has that code. Please check it and try again.")));
    }

    @Transactional(readOnly = true)
    public Summary summary() {
        return new Summary(cases.count(), cases.countByStatus(CaseStatus.OPEN), cases.countByStatus(CaseStatus.REFERRED),
                cases.countByStatus(CaseStatus.COURT), cases.countByStatus(CaseStatus.RESOLVED));
    }

    /** Used while registering: finds people already on record with a similar name. */
    @Transactional(readOnly = true)
    public List<PersonInfo> lookup(String name) {
        if (name == null || name.trim().length() < 3) return List.of();
        String pattern = "%" + name.trim().toLowerCase() + "%";
        return persons.search(pattern, PageRequest.of(0, 5)).stream().map(this::toPerson).toList();
    }

    private static String normalizeCode(String s) { return s == null ? "" : s.toUpperCase().replaceAll("[^A-Z0-9]", ""); }

    private List<Person> peopleIn(ChurchCase c, PartyRole role) {
        return c.getParties().stream().filter(p -> p.getRole() == role).map(CaseParty::getPerson).toList();
    }

    private CaseSummary toSummary(ChurchCase c) {
        List<Person> complainants = peopleIn(c, PartyRole.COMPLAINANT);
        List<IssueCategory> cats = c.getIssues().stream().map(CaseIssue::getCategory).distinct().toList();
        String church = complainants.isEmpty() ? "" : complainants.get(0).getChurch().getName();
        return new CaseSummary(c.getId(), c.getCode(),
                complainants.stream().map(Person::getFullName).toList(),
                peopleIn(c, PartyRole.SUBJECT).stream().map(Person::getFullName).toList(),
                church, c.getStatus(), c.getIssues().size(), cats, c.isLetterIssued(), c.getCreatedAt());
    }

    private PersonInfo toPerson(Person p) {
        return new PersonInfo(p.getId(), p.getFullName(), p.getPhone(), p.getChurch().getId(), p.getChurch().getName(),
                p.getWorkingStatus(), partyRepo.countCases(p.getId()), partyRepo.countCasesWithStatus(p.getId(), ACTIVE),
                partyRepo.countCasesAs(p.getId(), PartyRole.SUBJECT));
    }

    private CaseDetail toDetail(ChurchCase c) {
        List<Person> complainants = peopleIn(c, PartyRole.COMPLAINANT);
        List<Person> subjects = peopleIn(c, PartyRole.SUBJECT);
        Set<Long> ids = new LinkedHashSet<>();
        complainants.forEach(p -> ids.add(p.getId()));
        subjects.forEach(p -> ids.add(p.getId()));
        List<CaseSummary> related = ids.isEmpty() ? List.of()
                : cases.findRelated(ids, c.getId(), PageRequest.of(0, 10)).stream().map(this::toSummary).toList();
        List<IssueDto> issues = c.getIssues().stream().map(i -> new IssueDto(i.getId(), i.getCategory(), i.getDescription())).toList();
        return new CaseDetail(c.getId(), c.getCode(), c.getStatus(), c.getDiscussionNotes(), c.isLetterIssued(),
                c.getCreatedBy(), c.getCreatedAt(), complainants.stream().map(this::toPerson).toList(),
                subjects.stream().map(this::toPerson).toList(), issues, related);
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}
