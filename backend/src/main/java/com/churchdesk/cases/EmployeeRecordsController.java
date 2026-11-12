package com.churchdesk.cases;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.List;

/** Education and service history of an employee. Desk staff read it; officers and admins keep it up to date. */
@RestController
@RequestMapping("/api")
public class EmployeeRecordsController {
    private static final String READ = "hasAnyRole('ADMIN','OFFICER','RECEPTION')";
    private static final String WRITE = "hasAnyRole('ADMIN','OFFICER')";

    public record EducationDto(Long id, String kind, String level, String field, String institution, Integer startYear, Integer endYear, boolean completed, String notes) {}
    public record EducationRequest(@NotBlank @Pattern(regexp = "SPIRITUAL|SECULAR") String kind, @Size(max = 120) String level, @Size(max = 160) String field,
                                   @Size(max = 200) String institution, Integer startYear, Integer endYear, Boolean completed, @Size(max = 1000) String notes) {}
    public record PostingDto(Long id, String place, String position, LocalDate startDate, LocalDate endDate, String notes) {}
    public record PostingRequest(@NotBlank @Size(max = 200) String place, @Size(max = 160) String position, LocalDate startDate, LocalDate endDate, @Size(max = 1000) String notes) {}

    private final PersonRepository persons;
    private final EmployeeEducationRepository education;
    private final EmployeePostingRepository postings;

    public EmployeeRecordsController(PersonRepository persons, EmployeeEducationRepository education, EmployeePostingRepository postings) {
        this.persons = persons; this.education = education; this.postings = postings;
    }

    // ---- education ----

    @GetMapping("/employees/{id}/education") @PreAuthorize(READ) @Transactional(readOnly = true)
    public List<EducationDto> listEducation(@PathVariable Long id) {
        exists(id);
        return education.findByPersonIdOrderByKindAscEndYearDescStartYearDesc(id).stream().map(this::dto).toList();
    }

    @PostMapping("/employees/{id}/education") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize(WRITE) @Transactional
    public List<EducationDto> addEducation(@PathVariable Long id, @Valid @RequestBody EducationRequest r) {
        exists(id);
        EmployeeEducation e = new EmployeeEducation();
        e.setPersonId(id);
        applyEdu(e, r);
        education.save(e);
        return listEducation(id);
    }

    @PutMapping("/employee-education/{eid}") @PreAuthorize(WRITE) @Transactional
    public List<EducationDto> updateEducation(@PathVariable Long eid, @Valid @RequestBody EducationRequest r) {
        EmployeeEducation e = education.findById(eid).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        applyEdu(e, r);
        education.save(e);
        return listEducation(e.getPersonId());
    }

    @DeleteMapping("/employee-education/{eid}") @PreAuthorize(WRITE) @Transactional
    public List<EducationDto> deleteEducation(@PathVariable Long eid) {
        EmployeeEducation e = education.findById(eid).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        education.delete(e);
        return listEducation(e.getPersonId());
    }

    // ---- service history ----

    @GetMapping("/employees/{id}/service") @PreAuthorize(READ) @Transactional(readOnly = true)
    public List<PostingDto> listService(@PathVariable Long id) {
        exists(id);
        return postings.findByPersonIdOrderByStartDateDescIdDesc(id).stream().map(this::dto).toList();
    }

    @PostMapping("/employees/{id}/service") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize(WRITE) @Transactional
    public List<PostingDto> addService(@PathVariable Long id, @Valid @RequestBody PostingRequest r) {
        exists(id);
        EmployeePosting p = new EmployeePosting();
        p.setPersonId(id);
        applyPosting(p, r);
        postings.save(p);
        return listService(id);
    }

    @PutMapping("/employee-service/{sid}") @PreAuthorize(WRITE) @Transactional
    public List<PostingDto> updateService(@PathVariable Long sid, @Valid @RequestBody PostingRequest r) {
        EmployeePosting p = postings.findById(sid).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        applyPosting(p, r);
        postings.save(p);
        return listService(p.getPersonId());
    }

    @DeleteMapping("/employee-service/{sid}") @PreAuthorize(WRITE) @Transactional
    public List<PostingDto> deleteService(@PathVariable Long sid) {
        EmployeePosting p = postings.findById(sid).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        postings.delete(p);
        return listService(p.getPersonId());
    }

    private void applyEdu(EmployeeEducation e, EducationRequest r) {
        if (blank(r.level()) == null && blank(r.field()) == null && blank(r.institution()) == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter the level, the field of study or the school");
        if (r.startYear() != null && r.endYear() != null && r.endYear() < r.startYear())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The end year cannot be before the start year");
        e.setKind(r.kind()); e.setLevel(blank(r.level())); e.setField(blank(r.field())); e.setInstitution(blank(r.institution()));
        e.setStartYear(r.startYear()); e.setEndYear(r.endYear()); e.setCompleted(r.completed() == null || r.completed()); e.setNotes(blank(r.notes()));
    }

    private void applyPosting(EmployeePosting p, PostingRequest r) {
        if (r.startDate() != null && r.endDate() != null && r.endDate().isBefore(r.startDate()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The end date cannot be before the start date");
        p.setPlace(r.place().trim()); p.setPosition(blank(r.position())); p.setStartDate(r.startDate()); p.setEndDate(r.endDate()); p.setNotes(blank(r.notes()));
    }

    private void exists(Long id) { if (!persons.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"); }
    private static String blank(String s) { return s == null || s.isBlank() ? null : s.trim(); }
    private EducationDto dto(EmployeeEducation e) { return new EducationDto(e.getId(), e.getKind(), e.getLevel(), e.getField(), e.getInstitution(), e.getStartYear(), e.getEndYear(), e.isCompleted(), e.getNotes()); }
    private PostingDto dto(EmployeePosting p) { return new PostingDto(p.getId(), p.getPlace(), p.getPosition(), p.getStartDate(), p.getEndDate(), p.getNotes()); }
}
