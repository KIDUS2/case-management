package com.churchdesk.cases;

import com.churchdesk.cases.CaseDtos.PageDto;
import com.churchdesk.church.Church;
import com.churchdesk.church.ChurchRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/** The employee directory: identity, spiritual details, ID card dates and the employee's file. The same people appear in cases. */
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private static final String READ = "hasAnyRole('ADMIN','OFFICER','RECEPTION')";
    private static final String WRITE = "hasAnyRole('ADMIN','OFFICER')";

    public record EmployeeDto(Long id, String employeeId, String churchRef, String firstName, String middleName, String lastName, String fullName,
                              String motherName, Long churchId, String churchName, String phone, String email, String profession, String position,
                              String gender, LocalDate birthDate, LocalDate hireDate, String address, String notes,
                              String christianName, String fatherConfessor, String spiritualRank, LocalDate ordainedOn,
                              WorkingStatus workingStatus, boolean hasPhoto, LocalDate idIssuedOn, LocalDate idExpiresOn, boolean idExpired,
                              long totalCases, long openCases, long complaintsAgainst, long documents) {}

    public record EmployeeRequest(@Size(max = 40) String churchRef, @Size(max = 80) String firstName, @Size(max = 80) String middleName,
                                  @Size(max = 80) String lastName, @Size(max = 160) String motherName, @NotNull Long churchId,
                                  @Size(max = 40) String phone, @Size(max = 120) String email, @Size(max = 120) String profession,
                                  @Size(max = 120) String position, @Size(max = 10) String gender, LocalDate birthDate, LocalDate hireDate,
                                  @Size(max = 255) String address, @Size(max = 4000) String notes,
                                  @Size(max = 120) String christianName, @Size(max = 160) String fatherConfessor, @Size(max = 40) String spiritualRank,
                                  LocalDate ordainedOn, @NotNull WorkingStatus workingStatus, LocalDate idExpiresOn) {}

    public record ImportResult(int created, int updated, List<String> errors) {}

    private final PersonRepository persons;
    private final ChurchRepository churches;
    private final CasePartyRepository partyRepo;
    private final EmployeeFileRepository docs;
    private final EmployeePostingRepository postings;

    public EmployeeController(PersonRepository persons, ChurchRepository churches, CasePartyRepository partyRepo, EmployeeFileRepository docs, EmployeePostingRepository postings) {
        this.postings = postings; this.persons = persons; this.churches = churches; this.partyRepo = partyRepo; this.docs = docs;
    }

    @GetMapping @PreAuthorize(READ) @Transactional(readOnly = true)
    public PageDto<EmployeeDto> list(@RequestParam(required = false) String q, @RequestParam(required = false) Long churchId,
                                     @RequestParam(defaultValue = "false") boolean everyone,
                                     @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        String term = q == null ? "" : q.trim();
        if (term.matches("[0-9 \\-]+")) term = term.replaceAll("[ \\-]", ""); // an ID typed as 1234 5678 9012
        String like = "%" + term.toLowerCase() + "%";
        Page<Person> r = persons.directory(like, churchId, everyone, PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100), Sort.by("fullName")));
        return new PageDto<>(r.getContent().stream().map(this::dto).toList(), r.getTotalElements(), r.getNumber(), r.getSize());
    }

    @GetMapping("/{id}") @PreAuthorize(READ) @Transactional(readOnly = true)
    public EmployeeDto get(@PathVariable Long id) { return dto(find(id)); }

    /** Open a profile from the number on the card (or the QR code on it). */
    @GetMapping("/by-id/{employeeId}") @PreAuthorize(READ) @Transactional(readOnly = true)
    public EmployeeDto byId(@PathVariable String employeeId) {
        if (EmployeeIds.looksLikeId(employeeId) && !EmployeeIds.isValid(employeeId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This ID number is not valid. Please check the digits.");
        return persons.findFirstByEmployeeIdIgnoreCase(EmployeeIds.normalize(employeeId)).map(this::dto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No employee has this ID"));
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize(WRITE) @Transactional
    public EmployeeDto create(@Valid @RequestBody EmployeeRequest r) {
        Person p = new Person();
        apply(p, r, true);
        persons.findFirstByFullNameIgnoreCaseAndMotherNameIgnoreCase(p.getFullName(), p.getMotherName()).ifPresent(o -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, p.getFullName() + " (mother: " + p.getMotherName() + ") is already registered, ID "
                    + (o.getEmployeeId() == null ? "-" : o.getEmployeeId()));
        });
        Person saved = persons.save(p);
        recordPosting(saved, null, null);
        return dto(saved);
    }

    /** The ID number never changes after it is created. */
    @PutMapping("/{id}") @PreAuthorize(WRITE) @Transactional
    public EmployeeDto update(@PathVariable Long id, @Valid @RequestBody EmployeeRequest r) {
        Person p = find(id);
        Long oldChurch = p.getChurch().getId();
        String oldPosition = p.getPosition();
        apply(p, r, true);
        p = persons.save(p);
        recordPosting(p, oldChurch, oldPosition);
        return dto(p);
    }

    /** Moving to another church, or taking another position, closes the current posting and opens a new one. */
    private void recordPosting(Person p, Long oldChurchId, String oldPosition) {
        if (p.getWorkingStatus() == WorkingStatus.CHURCH_MEMBER) return;
        var open = postings.findFirstByPersonIdAndEndDateIsNullOrderByStartDateDescIdDesc(p.getId());
        boolean same = open.isPresent() && oldChurchId != null && oldChurchId.equals(p.getChurch().getId())
                && java.util.Objects.equals(oldPosition, p.getPosition());
        if (same) return;
        open.ifPresent(o -> { o.setEndDate(Times.today()); postings.save(o); });
        EmployeePosting n = new EmployeePosting();
        n.setPersonId(p.getId()); n.setPlace(p.getChurch().getName()); n.setPosition(p.getPosition());
        n.setStartDate(oldChurchId == null && p.getHireDate() != null ? p.getHireDate() : Times.today());
        postings.save(n);
    }

    /** A new card: same ID number, five more years. */
    @PostMapping("/{id}/renew") @PreAuthorize(WRITE) @Transactional
    public EmployeeDto renew(@PathVariable Long id) {
        Person p = find(id);
        if (p.getEmployeeId() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This person has no employee ID");
        p.setIdIssuedOn(Times.today());
        p.setIdExpiresOn(Times.today().plusYears(5));
        return dto(persons.save(p));
    }

    /** Bulk load from the church's list. Someone already known (by system ID or the church's own number) is updated; everyone else gets a new ID. */
    @PostMapping("/import") @PreAuthorize(WRITE) @Transactional
    public ImportResult importRows(@RequestBody List<@Valid EmployeeRequest> rows) {
        int created = 0, updated = 0;
        List<String> errors = new ArrayList<>();
        int n = 0;
        for (EmployeeRequest r : rows) {
            n++;
            try {
                String ref = blank(r.churchRef());
                Person p = null;
                if (ref != null) {
                    p = EmployeeIds.looksLikeId(ref) ? persons.findFirstByEmployeeIdIgnoreCase(EmployeeIds.normalize(ref)).orElse(null)
                            : persons.findFirstByChurchRefIgnoreCase(ref).orElse(null);
                }
                boolean isNew = p == null;
                if (isNew) p = new Person();
                apply(p, r, false);
                persons.save(p);
                if (isNew) created++; else updated++;
            } catch (ResponseStatusException e) {
                errors.add("Row " + n + ": " + e.getReason());
            }
        }
        return new ImportResult(created, updated, errors);
    }

    /** strict = a person at the desk is registering someone, so the full identity is required. */
    private void apply(Person p, EmployeeRequest r, boolean strict) {
        Church church = churches.findById(r.churchId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Church not found"));
        String first = blank(r.firstName()), middle = blank(r.middleName()), last = blank(r.lastName()), mother = blank(r.motherName());
        if (first == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter the first name");
        if (strict && middle == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter the middle name (father's name)");
        if (strict && last == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter the last name (grandfather's name)");
        if (strict && mother == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter the mother's name");
        p.setFirstName(first); p.setMiddleName(middle); p.setLastName(last); p.setMotherName(mother);
        p.setFullName(String.join(" ", Stream.of(first, middle, last).filter(x -> x != null).toList()));
        String ref = blank(r.churchRef());
        if (ref != null && !EmployeeIds.looksLikeId(ref)) p.setChurchRef(ref); else if (ref == null) p.setChurchRef(null);
        p.setChurch(church);
        p.setPhone(blank(r.phone())); p.setEmail(blank(r.email()));
        p.setProfession(blank(r.profession())); p.setPosition(blank(r.position()));
        p.setGender(blank(r.gender()));
        p.setBirthDate(r.birthDate()); p.setHireDate(r.hireDate());
        p.setAddress(blank(r.address())); p.setNotes(blank(r.notes()));
        p.setChristianName(blank(r.christianName())); p.setFatherConfessor(blank(r.fatherConfessor()));
        p.setSpiritualRank(blank(r.spiritualRank())); p.setOrdainedOn(r.ordainedOn());
        p.setWorkingStatus(r.workingStatus());
        if (p.getEmployeeId() == null && r.workingStatus() != WorkingStatus.CHURCH_MEMBER)
            p.assignId(EmployeeIds.generate(persons::existsByEmployeeId));
        if (p.getEmployeeId() != null && r.idExpiresOn() != null) p.setIdExpiresOn(r.idExpiresOn());
    }

    private Person find(Long id) { return persons.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found")); }
    private static String blank(String s) { return s == null || s.isBlank() ? null : s.trim(); }

    private EmployeeDto dto(Person p) {
        LocalDate exp = p.getIdExpiresOn();
        return new EmployeeDto(p.getId(), p.getEmployeeId(), p.getChurchRef(), p.getFirstName(), p.getMiddleName(), p.getLastName(), p.getFullName(),
                p.getMotherName(), p.getChurch().getId(), p.getChurch().getName(), p.getPhone(), p.getEmail(), p.getProfession(), p.getPosition(),
                p.getGender(), p.getBirthDate(), p.getHireDate(), p.getAddress(), p.getNotes(),
                p.getChristianName(), p.getFatherConfessor(), p.getSpiritualRank(), p.getOrdainedOn(),
                p.getWorkingStatus(), p.getPhotoFile() != null, p.getIdIssuedOn(), exp, exp != null && exp.isBefore(Times.today()),
                partyRepo.countCases(p.getId()), partyRepo.countCasesWithStatus(p.getId(), java.util.List.of(CaseStatus.OPEN, CaseStatus.REFERRED, CaseStatus.COURT)),
                partyRepo.countCasesAs(p.getId(), PartyRole.SUBJECT), docs.countByPersonId(p.getId()));
    }
}
