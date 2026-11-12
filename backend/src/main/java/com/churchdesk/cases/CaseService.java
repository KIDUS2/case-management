package com.churchdesk.cases;

import com.churchdesk.cases.CaseDtos.*;
import com.churchdesk.church.Church;
import com.churchdesk.church.ChurchRepository;
import jakarta.persistence.criteria.Join;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.List;

@Service
public class CaseService {
    private static final List<CaseStatus> ACTIVE = List.of(CaseStatus.OPEN, CaseStatus.REFERRED, CaseStatus.COURT);

    private final ChurchCaseRepository cases;
    private final PersonRepository persons;
    private final ChurchRepository churches;

    public CaseService(ChurchCaseRepository cases, PersonRepository persons, ChurchRepository churches) {
        this.cases = cases; this.persons = persons; this.churches = churches;
    }

    @Transactional
    public CaseDetail create(CreateCaseRequest r, String username) {
        Church church = churches.findById(r.churchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a church from the list"));
        String name = r.fullName().trim();

        // the same person at the same church is reused, so all their cases are linked together
        Person person = persons.findFirstByFullNameIgnoreCaseAndChurchId(name, church.getId()).orElseGet(Person::new);
        person.setFullName(name);
        person.setChurch(church);
        person.setWorkingStatus(r.workingStatus());
        if (r.phone() != null && !r.phone().isBlank()) person.setPhone(r.phone().trim());
        person = persons.save(person);

        ChurchCase c = new ChurchCase();
        c.setPerson(person);
        c.setRoleInCase(r.roleInCase());
        c.setDiscussionNotes(blankToNull(r.discussionNotes()));
        c.setLetterIssued(r.letterIssued());
        c.setCreatedBy(username);
        int order = 0;
        for (IssueIn in : r.issues()) {
            CaseIssue i = new CaseIssue();
            i.setChurchCase(c);
            i.setCategory(in.category());
            i.setDescription(blankToNull(in.description()));
            i.setSortOrder(order++);
            c.getIssues().add(i);
        }
        c = cases.save(c);
        c.setCaseNo(String.format("C-%d-%05d", LocalDate.now().getYear(), c.getId()));
        return toDetail(c);
    }

    @Transactional(readOnly = true)
    public PageDto<CaseSummary> list(String q, CaseStatus status, int page, int size) {
        Specification<ChurchCase> spec = (root, query, cb) -> cb.conjunction();
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> {
                Join<ChurchCase, Person> p = root.join("person");
                Join<Person, Church> ch = p.join("church");
                return cb.or(
                        cb.like(cb.lower(p.<String>get("fullName")), like),
                        cb.like(cb.lower(ch.<String>get("name")), like),
                        cb.like(cb.lower(root.<String>get("caseNo")), like));
            });
        }
        Page<ChurchCase> result = cases.findAll(spec, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "id")));
        return new PageDto<>(result.getContent().stream().map(this::toSummary).toList(),
                result.getTotalElements(), result.getNumber(), result.getSize());
    }

    @Transactional(readOnly = true)
    public CaseDetail get(Long id) {
        return toDetail(cases.findWithDetailsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found")));
    }

    @Transactional(readOnly = true)
    public Summary summary() {
        return new Summary(cases.count(), cases.countByStatus(CaseStatus.OPEN), cases.countByStatus(CaseStatus.REFERRED),
                cases.countByStatus(CaseStatus.COURT), cases.countByStatus(CaseStatus.RESOLVED));
    }

    /** Used at the door: finds people already on record with a similar name. */
    @Transactional(readOnly = true)
    public List<PersonInfo> lookup(String name) {
        if (name == null || name.trim().length() < 3) return List.of();
        String pattern = "%" + name.trim().toLowerCase() + "%";
        return persons.search(pattern, PageRequest.of(0, 5)).stream().map(this::toPerson).toList();
    }

    private CaseSummary toSummary(ChurchCase c) {
        List<IssueCategory> cats = c.getIssues().stream().map(CaseIssue::getCategory).distinct().toList();
        return new CaseSummary(c.getId(), c.getCaseNo(), c.getPerson().getFullName(), c.getPerson().getChurch().getName(),
                c.getStatus(), c.getIssues().size(), cats, c.isLetterIssued(), c.getCreatedAt());
    }

    private PersonInfo toPerson(Person p) {
        return new PersonInfo(p.getId(), p.getFullName(), p.getPhone(), p.getChurch().getId(), p.getChurch().getName(),
                p.getWorkingStatus(), cases.countByPersonId(p.getId()), cases.countByPersonIdAndStatusIn(p.getId(), ACTIVE));
    }

    private CaseDetail toDetail(ChurchCase c) {
        List<IssueDto> issues = c.getIssues().stream().map(i -> new IssueDto(i.getId(), i.getCategory(), i.getDescription())).toList();
        List<CaseSummary> others = cases.findByPersonIdOrderByIdDesc(c.getPerson().getId()).stream()
                .filter(o -> !o.getId().equals(c.getId())).map(this::toSummary).toList();
        return new CaseDetail(c.getId(), c.getCaseNo(), c.getStatus(), c.getRoleInCase(), c.getDiscussionNotes(),
                c.isLetterIssued(), c.getCreatedBy(), c.getCreatedAt(), toPerson(c.getPerson()), issues, others);
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}
