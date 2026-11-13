package com.churchdesk.option;

import com.churchdesk.option.OptionService.Edit;
import com.churchdesk.option.OptionService.Lists;
import com.churchdesk.option.OptionService.OptionDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/options")
public class OptionController {
    public record OptionRequest(@Size(max = 120) String label, @Size(max = 120) String labelAm, @Size(max = 16) String icon, Boolean active) {}

    private final OptionService service;
    public OptionController(OptionService service) { this.service = service; }

    /** Everyone signed in reads the lists; only the administrator changes them. */
    @GetMapping
    public Lists lists() { return service.lists(); }

    @PostMapping("/{list}") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('ADMIN')")
    public OptionDto add(@PathVariable String list, @Valid @RequestBody OptionRequest r) {
        return service.add(list.toUpperCase(), new Edit(r.label(), r.labelAm(), r.icon(), r.active()));
    }

    @PutMapping("/item/{id}") @PreAuthorize("hasRole('ADMIN')")
    public OptionDto edit(@PathVariable Long id, @Valid @RequestBody OptionRequest r) {
        return service.edit(id, new Edit(r.label(), r.labelAm(), r.icon(), r.active()));
    }

    @DeleteMapping("/item/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) { service.delete(id); }
}
