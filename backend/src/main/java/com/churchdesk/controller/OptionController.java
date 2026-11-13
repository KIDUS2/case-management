package com.churchdesk.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.churchdesk.dto.request.OptionEdit;
import com.churchdesk.dto.request.OptionRequest;
import com.churchdesk.dto.response.OptionDto;
import com.churchdesk.dto.response.OptionLists;
import com.churchdesk.service.OptionService;

@RestController
@RequestMapping("/api/options")
public class OptionController {

    private final OptionService service;
    public OptionController(OptionService service) { this.service = service; }

    /** Everyone signed in reads the lists; only the administrator changes them. */
    @GetMapping
    public OptionLists lists() { return service.lists(); }

    @PostMapping("/{list}") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('ADMIN')")
    public OptionDto add(@PathVariable String list, @Valid @RequestBody OptionRequest r) {
        return service.add(list.toUpperCase(), new OptionEdit(r.label(), r.labelAm(), r.icon(), r.active()));
    }

    @PutMapping("/item/{id}") @PreAuthorize("hasRole('ADMIN')")
    public OptionDto edit(@PathVariable Long id, @Valid @RequestBody OptionRequest r) {
        return service.edit(id, new OptionEdit(r.label(), r.labelAm(), r.icon(), r.active()));
    }

    @DeleteMapping("/item/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) { service.delete(id); }
}
