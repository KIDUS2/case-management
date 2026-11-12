package com.churchdesk.cases;

import com.churchdesk.cases.CaseDtos.PageDto;
import com.churchdesk.church.Church;
import com.churchdesk.church.ChurchRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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

/** The employee directory: who works where, their profession and details. The same people appear in cases. */
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private static final String READ = "hasAnyRole('ADMIN','OFFICER','RECEPTION')";
    private static final String WRITE = "hasAnyRole('ADMIN','OFFICER')";

    public record EmployeeDto(Long id, String employeeId, String fullName, Long churchId, String churchName, String phone, String email,
                              String profession, String position, String gender, LocalDate birthDate, LocalDate hireDate, String address,
                              String notes, WorkingStatus workingStatus, long totalCases, long openCases, long complaintsAgainst) {}

    public record EmployeeRequest(@Size(max = 40) String employeeId, @NotBlank @Size(max = 160) String fullName, @NotNull Long churchId,
                                  @Size(max = 40) String phone, @Size(max = 120) String email, @Size(max = 120) String profession,
                                  @Size(max = 120) String position, @Size(max = 10) String gender, LocalDate birthDate, LocalDate hireDate,
                                  @Size(max = 255) String address, @Size(max = 4000) String notes, @NotNull WorkingStatus workingStatus) {}

    public record ImportResult(int created, int updated, List<String> errors) {}

    private final PersonRepository persons;
    private final ChurchRepository churches;
    private final CasePartyRepository partyRepo;

    public EmployeeController(PersonRepository persons, ChurchRepository churches, CasePartyRepository partyRepo) {
        this.persons = persons; this.churches = churches; this.partyRepo = partyRepo;
    }

    @GetMapping @PreAuthorize(READ) @Transactional(readOnly = true)
    public PageDto<EmployeeDto> list(@RequestParam(required = false) String q, @RequestParam(required = false) Long churchId,
                                     @RequestParam(defaultValue = "false") boolean everyone,
                                     @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        String like = "%" + (q == null ? "" : q.trim().toLowerCase()) + "%";
        Page<Person> r = persons.directory(like, churchId, everyone, PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100), Sort.by("fullName")));
        return new PageDto<>(r.getContent().stream().map(this::dto).toList(), r.getTotalElements(), r.getNumber(), r.getSize());
    }

    @GetMapping("/{id}") @PreAuthorize(READ) @Transactional(readOnly = true)
    public EmployeeDto get(@PathVariable Long id) { return dto(find(id)); }

    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize(WRITE) @Transactional
    public EmployeeDto create(@Valid @RequestBody EmployeeRequest r) {
        String eid = blank(r.employeeId());
        if (eid != null && persons.findFirstByEmployeeIdIgnoreCase(eid).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Employee ID " + eid + " already exists");
        Person p = new Person();
        apply(p, r);
        return dto(persons.save(p));
    }

    @PutMapping("/{id}") @PreAuthorize(WRITE) @Transactional
    public EmployeeDto update(@PathVariable Long id, @Valid @RequestBody EmployeeRequest r) {
        Person p = find(id);
        String eid = blank(r.employeeId());
        if (eid != null) persons.findFirstByEmployeeIdIgnoreCase(eid).filter(o -> !o.getId().equals(id)).ifPresent(o -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Employee ID " + eid + " already belongs to " + o.getFullName());
        });
        apply(p, r);
        return dto(persons.save(p));
    }

    /** Bulk load from the church's list. Rows with a known employee ID are updated, the rest are created. */
    @PostMapping("/import") @PreAuthorize(WRITE) @Transactional
    public ImportResult importRows(@RequestBody List<@Valid EmployeeRequest> rows) {
        int created = 0, updated = 0;
        List<String> errors = new ArrayList<>();
        int n = 0;
        for (EmployeeRequest r : rows) {
            n++;
            try {
                String eid = blank(r.employeeId());
                Person p = eid == null ? null : persons.findFirstByEmployeeIdIgnoreCase(eid).orElse(null);
                if (p == null) { p = new Person(); created++; } else updated++;
                apply(p, r);
                persons.save(p);
            } catch (ResponseStatusException e) {
                errors.add("Row " + n + ": " + e.getReason());
            }
        }
        return new ImportResult(created, updated, errors);
    }

    private void apply(Person p, EmployeeRequest r) {
        Church church = churches.findById(r.churchId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Church not found"));
        p.setEmployeeId(blank(r.employeeId()));
        p.setFullName(r.fullName().trim());
        p.setChurch(church);
        p.setPhone(blank(r.phone())); p.setEmail(blank(r.email()));
        p.setProfession(blank(r.profession())); p.setPosition(blank(r.position()));
        p.setGender(blank(r.gender()));
        p.setBirthDate(r.birthDate()); p.setHireDate(r.hireDate());
        p.setAddress(blank(r.address())); p.setNotes(blank(r.notes()));
        p.setWorkingStatus(r.workingStatus());
    }

    private Person find(Long id) { return persons.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found")); }
    private static String blank(String s) { return s == null || s.isBlank() ? null : s.trim(); }

    private EmployeeDto dto(Person p) {
        return new EmployeeDto(p.getId(), p.getEmployeeId(), p.getFullName(), p.getChurch().getId(), p.getChurch().getName(), p.getPhone(), p.getEmail(),
                p.getProfession(), p.getPosition(), p.getGender(), p.getBirthDate(), p.getHireDate(), p.getAddress(), p.getNotes(), p.getWorkingStatus(),
                partyRepo.countCases(p.getId()), partyRepo.countCasesWithStatus(p.getId(), java.util.List.of(CaseStatus.OPEN, CaseStatus.REFERRED, CaseStatus.COURT)),
                partyRepo.countCasesAs(p.getId(), PartyRole.SUBJECT));
    }
}
