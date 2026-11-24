package com.churchdesk.service;

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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import com.churchdesk.dto.common.PageDto;
import com.churchdesk.dto.request.AddPartyRequest;
import com.churchdesk.dto.request.CreateCaseRequest;
import com.churchdesk.dto.request.IssueIn;
import com.churchdesk.dto.request.PartyIn;
import com.churchdesk.dto.response.CaseDetail;
import com.churchdesk.dto.response.CaseFileDto;
import com.churchdesk.dto.response.CaseSummary;
import com.churchdesk.dto.response.EventDto;
import com.churchdesk.dto.response.InboxDto;
import com.churchdesk.dto.response.InboxItem;
import com.churchdesk.dto.response.IssueDto;
import com.churchdesk.dto.response.PersonInfo;
import com.churchdesk.dto.response.QueueItem;
import com.churchdesk.dto.response.Summary;
import com.churchdesk.enums.CaseKind;
import com.churchdesk.enums.CaseStatus;
import com.churchdesk.enums.EventType;
import com.churchdesk.enums.IssueStatus;
import com.churchdesk.enums.PartyRole;
import com.churchdesk.enums.ReviewStatus;
import com.churchdesk.enums.Role;
import com.churchdesk.enums.WorkingStatus;
import com.churchdesk.model.AppUser;
import com.churchdesk.model.CaseEvent;
import com.churchdesk.model.CaseIssue;
import com.churchdesk.model.CaseLink;
import com.churchdesk.model.CaseParty;
import com.churchdesk.model.Church;
import com.churchdesk.model.ChurchCase;
import com.churchdesk.model.Department;
import com.churchdesk.model.Person;
import com.churchdesk.repository.CaseEventRepository;
import com.churchdesk.repository.CaseFileRepository;
import com.churchdesk.repository.CaseIssueRepository;
import com.churchdesk.repository.CaseLinkRepository;
import com.churchdesk.repository.CasePartyRepository;
import com.churchdesk.repository.ChurchCaseRepository;
import com.churchdesk.repository.ChurchRepository;
import com.churchdesk.repository.DepartmentRepository;
import com.churchdesk.repository.PersonRepository;
import com.churchdesk.util.EmployeeIds;
import com.churchdesk.util.Escalation;
import com.churchdesk.util.Times;

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
    private final DepartmentRepository departments;
    private final CaseIssueRepository issueRepo;
    private final CaseEventRepository eventRepo;
    private final CaseFileRepository fileRepo;
    private final CaseFlowService flow;
    private final AccessService access;
    private final com.churchdesk.service.OptionService options;
    private final CaseLinkRepository linkRepo;
    private final SmsService sms;
    private final AppointmentService appointments;
    private final SecureRandom random = new SecureRandom();

    public CaseService(ChurchCaseRepository cases, CasePartyRepository partyRepo, PersonRepository persons, ChurchRepository churches,
                       DepartmentRepository departments, CaseIssueRepository issueRepo, CaseEventRepository eventRepo,
                       CaseFileRepository fileRepo, CaseFlowService flow, AccessService access, CaseLinkRepository linkRepo, com.churchdesk.service.OptionService options, SmsService sms, AppointmentService appointments) {
        this.sms = sms; this.appointments = appointments;
        this.options = options;
        this.linkRepo = linkRepo;
        this.cases = cases; this.partyRepo = partyRepo; this.persons = persons; this.churches = churches;
        this.departments = departments; this.issueRepo = issueRepo; this.eventRepo = eventRepo; this.fileRepo = fileRepo; this.flow = flow; this.access = access;
    }

    /** The desk registers a case: it is accepted from the start. */
    @Transactional
    public CaseDetail create(CreateCaseRequest r, AppUser actor) {
        CaseDetail again = alreadyRegistered(r, actor);
        if (again != null) return again;
        CaseDetail d = createCase(r, actor, ReviewStatus.ACCEPTED);
        ChurchCase c = cases.findById(d.id()).orElseThrow();
        sms.sendCaseNumber(c, actor.getUsername()); // never fails the registration; see SmsService
        return toDetail(c);
    }

    /**
     * A sub-city office submits a case. Every person must belong to a church of its own sub-city, nothing is sent to a
     * department yet, and the case waits for an officer or the administrator to accept it.
     */
    @Transactional
    public CaseDetail submit(CreateCaseRequest r, AppUser actor) {
        CaseDetail again = alreadyRegistered(r, actor);
        if (again != null) return again;
        if (actor.getRole() != Role.SUBCITY || actor.getSubCity() == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only a sub-city account can submit a case");
        List<PartyIn> everyone = new ArrayList<>(r.complainants());
        if (r.subjects() != null) everyone.addAll(r.subjects());
        for (PartyIn in : everyone) {
            Church ch = churches.findById(in.churchId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a church from the list for " + in.fullName().trim()));
            if (!actor.getSubCity().equals(ch.getSubCity()))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ch.getName() + " is not in " + actor.getSubCity() + ". You can only submit cases for your own sub-city.");
        }
        List<IssueIn> issues = r.issues().stream().map(i -> new IssueIn(i.category(), i.description(), null, null)).toList();
        CreateCaseRequest clean = new CreateCaseRequest(r.complainants(), r.subjects(), issues, r.discussionNotes(), false, r.kind(), null, r.expectedPeople(), r.clientRef());
        CaseDetail d = createCase(clean, actor, ReviewStatus.PENDING);
        ChurchCase made = cases.findById(d.id()).orElseThrow();
        flow.notifySubmitted(made, actor);
        // the sub-city already solved it: record the solution and share it with the diocese
        if (r.localSolution() != null && !r.localSolution().isBlank()) {
            flow.resolveLocally(made, r.localSolution().trim(), actor);
            return toDetail(made);
        }
        return d;
    }

    /** A device that was offline sends the same case again until it gets an answer; the second time it gets the first case back. */
    private CaseDetail alreadyRegistered(CreateCaseRequest r, AppUser actor) {
        String ref = blankToNull(r.clientRef());
        if (ref == null) return null;
        return cases.findByClientRef(ref).map(c -> {
            if (!actor.getUsername().equals(c.getCreatedBy())) throw new ResponseStatusException(HttpStatus.CONFLICT, "This case reference was already used.");
            return toDetail(c);
        }).orElse(null);
    }

    private CaseDetail createCase(CreateCaseRequest r, AppUser actor, ReviewStatus review) {
        ChurchCase c = new ChurchCase();
        c.setClientRef(blankToNull(r.clientRef()));
        c.setReviewStatus(review);
        final boolean charity = "CHARITY".equalsIgnoreCase(r.kind());
        c.setKind(charity ? CaseKind.CHARITY : CaseKind.ISSUE);
        c.setCode(newCode());
        c.setDiscussionNotes(blankToNull(r.discussionNotes()));
        c.setLetterIssued(r.letterIssued());
        c.setCreatedBy(actor.getUsername());
        c.setExpectedPeople(r.expectedPeople());

        Set<String> seen = new HashSet<>();
        int order = 0;
        for (PartyIn in : r.complainants()) order = addParty(c, in, PartyRole.COMPLAINANT, order, seen, actor);
        if (r.subjects() != null) {
            for (PartyIn in : r.subjects()) order = addParty(c, in, PartyRole.SUBJECT, order, seen, actor);
        }

        int issueOrder = 0;
        for (IssueIn in : r.issues()) {
            CaseIssue i = new CaseIssue();
            i.setChurchCase(c);
            // a charity request is not an issue: it always has the charity type
            i.setCategory(options.requireIssueType(charity ? "CHARITY" : in.category()));
            i.setDescription(blankToNull(in.description()));
            i.setSortOrder(issueOrder++);
            c.getIssues().add(i);
        }
        c = cases.save(c);
        flow.recordCreated(c, actor);
        // issues the desk already sent to a department go out (and notify it) right away
        for (int k = 0; k < r.issues().size(); k++) {
            IssueIn in = r.issues().get(k);
            if (in.departmentId() == null) continue;
            Department d = departments.findById(in.departmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));
            flow.applyReferral(c, c.getIssues().get(k), d, in.returnOn(), null, actor);
        }
        return toDetail(c);
    }

    /** The same person at the same church is reused, so all their cases are linked together. */
    private int addParty(ChurchCase c, PartyIn in, PartyRole role, int order, Set<String> seen, AppUser actor) {
        Church church = churches.findById(in.churchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a church from the list for " + in.fullName().trim()));
        String name = in.fullName().trim();
        String typed = blankToNull(in.employeeId());
        Person person = typed == null ? null : findByAnyId(typed);
        if (person == null) person = persons.findFirstByFullNameIgnoreCaseAndChurchId(name, church.getId()).orElseGet(Person::new);
        if (typed != null && person.getId() == null && !EmployeeIds.looksLikeId(typed)) person.setChurchRef(typed);
        String sebeka = blankToNull(in.sebekaGubayeNo());
        if (sebeka != null) person.setSebekaGubayeNo(sebeka);
        if (role == PartyRole.COMPLAINANT) requireIdNumber(person, in, typed, name);
        person.setFullName(name);
        String fn = blankToNull(in.firstName()), ln = blankToNull(in.lastName());
        if (fn != null && ln != null) { person.setFirstName(fn); person.setLastName(ln); } else if (person.getFirstName() == null) person.splitFullName();
        if (in.title() != null) person.setTitle(options.optionalTitle(in.title()));
        person.setChurch(church);
        person.setWorkingStatus(options.requireWorkingStatus(in.workingStatus()));
        if (in.phone() != null && !in.phone().isBlank()) person.setPhone(in.phone().trim());
        if (in.extraPhones() != null) person.setExtraPhoneList(in.extraPhones());
        // the phone number is mandatory; only the administrator can allow a person to have none
        if (in.phoneExempt() != null && actor.getRole() == Role.ADMIN) person.setPhoneExempt(in.phoneExempt());
        if (person.getPhone() == null && !person.isPhoneExempt())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter a phone number for " + name + ". Only the administrator can allow a person without one.");
        if (person.getEmployeeId() == null && !WorkingStatus.CHURCH_MEMBER.equals(in.workingStatus()))
            person.assignId(EmployeeIds.generate(persons::existsByEmployeeId));
        person = persons.save(person);

        if (!seen.add(person.getId() + ":" + role)) return order; // same person listed twice in the same role
        CaseParty p = new CaseParty();
        p.setChurchCase(c);
        p.setPerson(person);
        p.setRole(role);
        p.setSortOrder(order);
        p.setInvolvement(blankToNull(in.involvement()));
        c.getParties().add(p);
        return order + 1;
    }

    /**
     * The person who brings the case must tell us who they are: an employee gives their Employee ID, everyone else
     * their Sebeka Gubaye number. Nothing is asked again if we already hold it from an earlier case.
     */
    private static void requireIdNumber(Person person, PartyIn in, String typedEmployeeId, String name) {
        if (WorkingStatus.CHURCH_MEMBER.equals(in.workingStatus())) {
            if (person.getSebekaGubayeNo() == null)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter the Sebeka Gubaye number of " + name + ".");
        } else if (typedEmployeeId == null && person.getEmployeeId() == null && person.getChurchRef() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter the Employee ID of " + name + ".");
        }
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

    /** Cases registered on or between these days (Addis Ababa time); either end may be left out. */
    private static Specification<ChurchCase> registeredBetween(LocalDate from, LocalDate to) {
        return (root, query, cb) -> cb.and(cb.greaterThanOrEqualTo(root.<java.time.Instant>get("createdAt"), Times.from(from)), cb.lessThan(root.<java.time.Instant>get("createdAt"), Times.until(to)));
    }

    @Transactional(readOnly = true)
    public PageDto<CaseSummary> list(String q, CaseStatus status, ReviewStatus review, CaseKind kind, LocalDate from, LocalDate to, int page, int size, AppUser actor) {
        Specification<ChurchCase> spec = access.visibleTo(actor).and(registeredBetween(from, to));
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (review != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("reviewStatus"), review));
        }
        if (kind != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("kind"), kind));
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
    public CaseDetail get(Long id, AppUser actor) {
        ChurchCase c = cases.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
        access.assertCanView(c, actor);
        return toDetail(c);
    }

    /** Staff type the short code (dashes and spaces are ignored) to open a case. */
    @Transactional(readOnly = true)
    public CaseDetail getByCode(String code, AppUser actor) {
        ChurchCase c = cases.findByCode(normalizeCode(code))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No case has that code. Please check it and try again."));
        access.assertCanView(c, actor);
        return toDetail(c);
    }

    /** People asked to come back to the door, soonest first (overdue ones are included so nobody is forgotten). */
    @Transactional(readOnly = true)
    public List<QueueItem> queue(int days) {
        LocalDate until = Times.today().plusDays(Math.min(Math.max(days, 0), 90));
        Map<Long, List<CaseIssue>> byCase = new LinkedHashMap<>();
        for (CaseIssue i : issueRepo.findExpected(until, IssueStatus.RESOLVED))
            byCase.computeIfAbsent(i.getChurchCase().getId(), k -> new ArrayList<>()).add(i);
        List<QueueItem> out = new ArrayList<>();
        for (List<CaseIssue> list : byCase.values()) {
            ChurchCase c = list.get(0).getChurchCase();
            LocalDate when = list.stream().map(CaseIssue::getReturnOn).min(LocalDate::compareTo).orElse(until);
            List<Person> who = peopleIn(c, PartyRole.COMPLAINANT);
            out.add(new QueueItem(c.getId(), c.getCode(), when, who.stream().map(Person::getFullName).toList(),
                    who.isEmpty() ? "" : who.get(0).getChurch().getName(),
                    list.stream().map(i -> i.getDepartment() == null ? null : i.getDepartment().getName()).filter(n -> n != null).distinct().toList(),
                    list.size(), appointments.spotFor(c.getId(), when)));
        }
        out.sort((a, b) -> a.returnOn().compareTo(b.returnOn()));
        return out;
    }

    /** 1 = next to be served in the department; 0 = not waiting in a queue. */
    private int queuePosition(CaseIssue i) {
        if (i.getStatus() != IssueStatus.REFERRED || i.isHeld() || i.getDepartment() == null || i.getReferredAt() == null) return 0;
        return 1 + (int) issueRepo.countAhead(i.getDepartment().getId(), IssueStatus.REFERRED, i.getId(), i.getPriority(), i.getReferredAt());
    }

    /** What a department has received (pending) or already finished (resolved). */
    @Transactional(readOnly = true)
    public InboxDto inbox(Long departmentId, boolean resolved, LocalDate from, LocalDate to, int page, int size) {
        List<IssueStatus> statuses = resolved ? List.of(IssueStatus.RESOLVED) : List.of(IssueStatus.REFERRED, IssueStatus.COURT);
        PageRequest pr = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
        Page<CaseIssue> result = resolved ? issueRepo.findForDepartment(departmentId, statuses, Times.from(from), Times.until(to), pr) : issueRepo.findQueueForDepartment(departmentId, statuses, Times.from(from), Times.until(to), pr);
        LocalDate today = Times.today();
        List<InboxItem> items = result.getContent().stream().map(i -> toInbox(i, today)).toList();
        long pending = issueRepo.countByDepartmentIdAndStatus(departmentId, IssueStatus.REFERRED);
        return new InboxDto(items, result.getTotalElements(), result.getNumber(), result.getSize(), pending);
    }

    private InboxItem toInbox(CaseIssue i, LocalDate today) {
        ChurchCase c = i.getChurchCase();
        List<Person> who = peopleIn(c, PartyRole.COMPLAINANT);
        return new InboxItem(i.getId(), c.getId(), c.getCode(), i.getCategory(), i.getDescription(), i.getStatus(),
                i.getDepartment() == null ? "" : i.getDepartment().getName(), i.getReferredAt(), i.getReturnOn(), who.stream().map(Person::getFullName).toList(),
                peopleIn(c, PartyRole.SUBJECT).stream().map(Person::getFullName).toList(),
                who.isEmpty() ? "" : who.get(0).getChurch().getName(), i.getResolvedAt(), i.getResolvedBy(), i.getResolutionNote(),
                i.getPriority(), Escalation.dueOn(i), Escalation.daysLate(i, today), i.getEscalationLevel(), queuePosition(i),
                who.isEmpty() ? null : who.get(0).getChurch().getSubCity(), i.isHeld(), i.getHandlerLevel());
    }

    /** Issues a department passed up: Sera Askiyajie sees level 1, Papas level 2, the administrator both. */
    @Transactional(readOnly = true)
    public InboxDto escalatedInbox(AppUser actor, LocalDate from, LocalDate to, int page, int size) {
        int min = actor.getRole() == Role.PAPAS ? 2 : 1;
        int max = actor.getRole() == Role.SERA_ASKIYAJIE ? 1 : 2;
        PageRequest pr = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
        Page<CaseIssue> result = issueRepo.findAtLevel(min, max, IssueStatus.RESOLVED, Times.from(from), Times.until(to), pr);
        LocalDate today = Times.today();
        return new InboxDto(result.getContent().stream().map(i -> toInbox(i, today)).toList(), result.getTotalElements(), result.getNumber(), result.getSize(), result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Summary summary(AppUser actor, LocalDate from, LocalDate to) {
        Specification<ChurchCase> mine = access.visibleTo(actor).and(registeredBetween(from, to));
        return new Summary(cases.count(mine), count(mine, CaseStatus.OPEN), count(mine, CaseStatus.REFERRED),
                count(mine, CaseStatus.COURT), count(mine, CaseStatus.RESOLVED),
                cases.count(mine.and((root, query, cb) -> cb.equal(root.get("reviewStatus"), ReviewStatus.PENDING))));
    }

    private long count(Specification<ChurchCase> mine, CaseStatus s) {
        return cases.count(mine.and((root, query, cb) -> cb.equal(root.get("status"), s)));
    }

    /** Used while registering: finds people already on record with a similar name. */
    @Transactional(readOnly = true)
    public List<PersonInfo> lookup(String name) {
        if (name == null || name.trim().length() < 3) return List.of();
        String q = name.trim().toLowerCase();
        String pattern = "%" + q + "%";
        // an ID or phone may be typed with spaces or dashes: "0123 4567", "+251 91-1"
        String compact = q.replaceAll("[\\s-]", "");
        String digits = compact.matches("\\+?\\d{3,}") ? "%" + compact + "%" : "%@@no-digits@@%";
        return persons.search(pattern, digits, PageRequest.of(0, 6)).stream().map(this::toPerson).toList();
    }

    /** Finds a person by the system ID (12 digits, spaces allowed) or by the number the church used before. */
    private Person findByAnyId(String typed) {
        String n = EmployeeIds.normalize(typed);
        if (EmployeeIds.looksLikeId(n)) return persons.findFirstByEmployeeIdIgnoreCase(n).orElse(null);
        return persons.findFirstByChurchRefIgnoreCase(typed.trim()).orElse(null);
    }

    /** Typing an employee ID brings back everything we know about that person. */
    public PersonInfo byEmployeeId(String id) {
        if (id == null || id.isBlank()) return null;
        if (EmployeeIds.looksLikeId(id) && !EmployeeIds.isValid(id))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This ID number is not valid. Please check the digits.");
        Person p = findByAnyId(id);
        return p == null ? null : toPerson(p);
    }

    private static String normalizeCode(String s) { return s == null ? "" : s.toUpperCase().replaceAll("[^A-Z0-9]", ""); }

    private List<Person> peopleIn(ChurchCase c, PartyRole role) {
        return c.getParties().stream().filter(p -> p.getRole() == role).map(CaseParty::getPerson).toList();
    }

    public CaseSummary toSummary(ChurchCase c) {
        List<Person> complainants = peopleIn(c, PartyRole.COMPLAINANT);
        List<String> cats = c.getIssues().stream().map(CaseIssue::getCategory).distinct().toList();
        String church = complainants.isEmpty() ? "" : complainants.get(0).getChurch().getName();
        return new CaseSummary(c.getId(), c.getCode(),
                complainants.stream().map(Person::getFullName).toList(),
                peopleIn(c, PartyRole.SUBJECT).stream().map(Person::getFullName).toList(),
                church, c.getStatus(), c.getIssues().size(),
                (int) c.getIssues().stream().filter(i -> i.getStatus() == IssueStatus.RESOLVED).count(), cats, c.isLetterIssued(), c.getCreatedAt(), c.getReviewStatus(), c.getKind());
    }

    private PersonInfo toPerson(Person p) { return toPerson(p, null); }

    private PersonInfo toPerson(Person p, String involvement) {
        return new PersonInfo(p.getId(), p.getFullName(), p.getPhone(), p.getChurch().getId(), p.getChurch().getName(),
                p.getWorkingStatus(), partyRepo.countCases(p.getId()), partyRepo.countCasesWithStatus(p.getId(), ACTIVE),
                partyRepo.countCasesAs(p.getId(), PartyRole.SUBJECT), involvement, p.getEmployeeId(), p.getProfession(), p.getPosition(), p.getExtraPhoneList(), p.isPhoneExempt(), p.getTitle());
    }

    /** Calls another person into a case that is already open (a witness, the accountant, another employee...). */
    @Transactional
    public CaseDetail addParty(Long caseId, AddPartyRequest r, AppUser actor) {
        ChurchCase c = cases.findById(caseId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
        access.assertCanView(c, actor);
        Set<String> seen = new HashSet<>();
        for (CaseParty p : c.getParties()) seen.add(p.getPerson().getId() + ":" + p.getRole());
        int before = c.getParties().size();
        addParty(c, r.person(), r.role(), before, seen, actor);
        if (c.getParties().size() == before)
            throw new ResponseStatusException(HttpStatus.CONFLICT, r.person().fullName().trim() + " is already in this case in that role");
        cases.save(c);
        String what = switch (r.role()) { case COMPLAINANT -> "also reporting"; case SUBJECT -> "the case is about them"; case INVOLVED -> "involved"; };
        String extra = blankToNull(r.person().involvement()) == null ? "" : ": " + r.person().involvement().trim();
        eventRepo.save(new CaseEvent(c.getId(), null, EventType.NOTE, "Person added: " + r.person().fullName().trim() + " (" + what + ")" + extra, actor.getUsername()));
        return toDetail(c);
    }

    /** A new sub-case (issue) on a case that already exists. */
    @Transactional
    public CaseDetail addIssue(Long caseId, IssueIn in, AppUser actor) {
        ChurchCase c = cases.findById(caseId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
        access.assertCanView(c, actor);
        if (!"UNCLEAR".equals(in.category()) && blankToNull(in.description()) == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please describe the new sub-case, or mark it “Not clear yet”");
        CaseIssue i = new CaseIssue();
        i.setChurchCase(c);
        i.setCategory(options.requireIssueType(in.category()));
        i.setDescription(blankToNull(in.description()));
        i.setSortOrder(c.getIssues().size());
        c.getIssues().add(i);
        c = cases.saveAndFlush(c);
        CaseIssue saved = c.getIssues().get(c.getIssues().size() - 1);
        eventRepo.save(new CaseEvent(c.getId(), saved.getId(), EventType.NOTE, "Sub-case added: " + options.issueTypeLabel(saved.getCategory()) + (saved.getDescription() == null ? "" : " — " + saved.getDescription()), actor.getUsername()));
        if (in.departmentId() != null) {
            Department d = departments.findById(in.departmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));
            flow.applyReferral(c, saved, d, in.returnOn(), null, actor);
        } else {
            flow.refreshStatus(c);
        }
        return toDetail(c);
    }

    @Transactional
    public CaseDetail linkCase(Long caseId, String code, AppUser actor) {
        ChurchCase c = cases.findById(caseId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
        access.assertCanView(c, actor);
        String wanted = code.trim().toUpperCase().replace("-", "").replace(" ", "");
        ChurchCase o = cases.findByCode(wanted).or(() -> cases.findByCode(code.trim().toUpperCase()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No case with the code " + code.trim()));
        access.assertCanView(o, actor);
        if (o.getId().equals(c.getId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A case cannot be related to itself");
        if (linkRepo.existsByCaseIdAndLinkedCaseId(c.getId(), o.getId()) || linkRepo.existsByCaseIdAndLinkedCaseId(o.getId(), c.getId()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "These cases are already linked");
        CaseLink l = new CaseLink();
        l.setCaseId(c.getId()); l.setLinkedCaseId(o.getId()); l.setLinkedBy(actor.getUsername());
        linkRepo.save(l);
        eventRepo.save(new CaseEvent(c.getId(), null, EventType.NOTE, "Linked to case " + o.getCode(), actor.getUsername()));
        eventRepo.save(new CaseEvent(o.getId(), null, EventType.NOTE, "Linked to case " + c.getCode(), actor.getUsername()));
        return toDetail(c);
    }

    @Transactional
    public CaseDetail unlinkCase(Long caseId, Long otherId, AppUser actor) {
        ChurchCase c = cases.findById(caseId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
        access.assertCanView(c, actor);
        for (CaseLink l : linkRepo.findByCaseIdOrLinkedCaseId(caseId, caseId)) {
            if (l.getCaseId().equals(otherId) || l.getLinkedCaseId().equals(otherId)) {
                linkRepo.delete(l);
                String oc = cases.findById(otherId).map(ChurchCase::getCode).orElse("another case");
                eventRepo.save(new CaseEvent(caseId, null, EventType.NOTE, "Link removed to case " + oc, actor.getUsername()));
            }
        }
        return toDetail(c);
    }

    private CaseDetail toDetail(ChurchCase c) {
        List<Person> complainants = peopleIn(c, PartyRole.COMPLAINANT);
        List<Person> subjects = peopleIn(c, PartyRole.SUBJECT);
        List<PersonInfo> involved = c.getParties().stream().filter(p -> p.getRole() == PartyRole.INVOLVED)
                .map(p -> toPerson(p.getPerson(), p.getInvolvement())).toList();
        Set<Long> ids = new LinkedHashSet<>();
        complainants.forEach(p -> ids.add(p.getId()));
        subjects.forEach(p -> ids.add(p.getId()));
        involved.forEach(p -> ids.add(p.id()));
        Map<Long, ChurchCase> relatedById = new LinkedHashMap<>();
        Set<Long> linkedIds = new LinkedHashSet<>();
        for (CaseLink l : linkRepo.findByCaseIdOrLinkedCaseId(c.getId(), c.getId())) {
            Long other = l.getCaseId().equals(c.getId()) ? l.getLinkedCaseId() : l.getCaseId();
            cases.findById(other).ifPresent(o -> { relatedById.put(o.getId(), o); linkedIds.add(o.getId()); });
        }
        if (!ids.isEmpty()) cases.findRelated(ids, c.getId(), PageRequest.of(0, 10)).forEach(o -> relatedById.putIfAbsent(o.getId(), o));
        List<CaseSummary> related = relatedById.values().stream().map(this::toSummary).toList();
        List<IssueDto> issues = c.getIssues().stream().map(i -> new IssueDto(i.getId(), i.getCategory(), i.getDescription(), i.getStatus(),
                i.getDepartment() == null ? null : i.getDepartment().getId(), i.getDepartment() == null ? null : i.getDepartment().getName(),
                i.getReferredAt(), i.getReturnOn(), i.getResolutionNote(), i.getResolvedBy(), i.getResolvedAt(),
                i.getCourtAt(), i.getCourtAckBy(), i.getCourtAckAt(),
                i.getPriority(), Escalation.dueOn(i), Escalation.daysLate(i, Times.today()), i.getEscalationLevel(), queuePosition(i),
                i.isHeld(), i.getHoldReason(), i.getHandlerLevel())).toList();
        List<EventDto> events = eventRepo.findByCaseIdOrderByCreatedAtDescIdDesc(c.getId()).stream()
                .map(e -> new EventDto(e.getId(), e.getIssueId(), e.getType(), e.getMessage(), e.getActor(), e.getCreatedAt())).toList();
        List<CaseFileDto> files = fileRepo.findByCaseIdOrderByUploadedAtDesc(c.getId()).stream()
                .map(f -> new CaseFileDto(f.getId(), f.getIssueId(), f.getInquiryId(), f.getStage(), f.getOriginalName(), f.getContentType(), f.getSizeBytes(), f.getUploadedBy(), f.getUploadedAt())).toList();
        return new CaseDetail(c.getId(), c.getCode(), c.getStatus(), c.getDiscussionNotes(), c.isLetterIssued(),
                c.getCreatedBy(), c.getCreatedAt(), complainants.stream().map(this::toPerson).toList(),
                subjects.stream().map(this::toPerson).toList(), involved, issues, related, new ArrayList<>(linkedIds), events, files,
                c.getReviewStatus(), c.getReviewNote(), c.getReviewedBy(), c.getKind(), c.isSubCitySolved(), c.getExpectedPeople());
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}
