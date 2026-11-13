package com.churchdesk.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import com.churchdesk.dto.request.DepartmentRequest;
import com.churchdesk.dto.response.DepartmentDto;
import com.churchdesk.model.Department;
import com.churchdesk.repository.DepartmentRepository;
import com.churchdesk.repository.UserRepository;
import com.churchdesk.service.OptionService;

/** Everyone signed in can read the list (to refer an issue); only the admin changes it. */
@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentRepository repo;
    private final UserRepository users;

    private final OptionService options;
    public DepartmentController(DepartmentRepository repo, UserRepository users, OptionService options) { this.repo = repo; this.users = users; this.options = options; }

    @GetMapping
    public List<DepartmentDto> list() { return repo.findAllByOrderByNameAsc().stream().map(this::dto).toList(); }

    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('ADMIN')") @Transactional
    public DepartmentDto create(@Valid @RequestBody DepartmentRequest r) {
        String name = r.name().trim();
        if (repo.existsByNameIgnoreCase(name)) throw new ResponseStatusException(HttpStatus.CONFLICT, "A department with that name already exists");
        Department d = new Department();
        d.setName(name);
        d.setHandlesCategory(r.handlesCategory() == null || r.handlesCategory().isBlank() ? null : options.requireIssueType(r.handlesCategory()));
        return dto(repo.save(d));
    }

    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") @Transactional
    public DepartmentDto update(@PathVariable Long id, @Valid @RequestBody DepartmentRequest r) {
        Department d = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
        String name = r.name().trim();
        if (!name.equalsIgnoreCase(d.getName()) && repo.existsByNameIgnoreCase(name))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A department with that name already exists");
        d.setName(name);
        d.setHandlesCategory(r.handlesCategory() == null || r.handlesCategory().isBlank() ? null : options.requireIssueType(r.handlesCategory()));
        if (r.active() != null) d.setActive(r.active());
        return dto(d);
    }

    private DepartmentDto dto(Department d) {
        return new DepartmentDto(d.getId(), d.getName(), d.getHandlesCategory(), d.isActive(), users.countByDepartmentId(d.getId()));
    }
}
