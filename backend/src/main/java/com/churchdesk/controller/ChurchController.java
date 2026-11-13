package com.churchdesk.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import com.churchdesk.dto.request.BulkItem;
import com.churchdesk.dto.request.BulkRequest;
import com.churchdesk.dto.request.CreateChurch;
import com.churchdesk.dto.request.UpdateChurch;
import com.churchdesk.dto.response.BulkResult;
import com.churchdesk.dto.response.ChurchDto;
import com.churchdesk.model.Church;
import com.churchdesk.repository.ChurchRepository;
import com.churchdesk.service.OptionService;

@RestController
@RequestMapping("/api/churches")
public class ChurchController {

    private final ChurchRepository repo;
    private final com.churchdesk.service.OptionService options;
    public ChurchController(ChurchRepository repo, com.churchdesk.service.OptionService options) { this.repo = repo; this.options = options; }

    @GetMapping
    public List<ChurchDto> list() {
        return repo.findAllByOrderByNameAsc().stream().map(c -> new ChurchDto(c.getId(), c.getName(), c.getSubCity(), c.getLatitude() != null)).toList();
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('ADMIN')")
    public ChurchDto create(@Valid @RequestBody CreateChurch r) {
        String name = r.name().trim();
        if (repo.existsByNameIgnoreCase(name)) throw new ResponseStatusException(HttpStatus.CONFLICT, "That church is already in the list");
        Church c = new Church();
        c.setName(name);
        c.setSubCity(options.requireSubCity(r.subCity()));
        c = repo.save(c);
        return new ChurchDto(c.getId(), c.getName(), c.getSubCity(), c.getLatitude() != null);
    }

    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") @Transactional
    public ChurchDto update(@PathVariable Long id, @Valid @RequestBody UpdateChurch r) {
        Church c = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Church not found"));
        c.setSubCity(options.requireSubCity(r.subCity()));
        return new ChurchDto(c.getId(), c.getName(), c.getSubCity(), c.getLatitude() != null);
    }

    /** Many churches at once (pasted or from a file). Names already there are skipped, but get their kefle ketema filled in if it was empty. */
    @PostMapping("/bulk") @PreAuthorize("hasRole('ADMIN')") @Transactional
    public BulkResult bulk(@Valid @RequestBody BulkRequest r) {
        List<BulkItem> items = new java.util.ArrayList<>();
        if (r.items() != null) items.addAll(r.items());
        if (r.names() != null) for (String n : r.names()) items.add(new BulkItem(n == null ? "" : n, null));
        Set<String> seen = new HashSet<>();
        int added = 0, skipped = 0, updated = 0;
        for (BulkItem it : items) {
            String name = it.name() == null ? "" : it.name().trim();
            if (name.isEmpty()) continue;
            String sub = options.matchSubCity(it.subCity());
            if (name.length() > 160 || !seen.add(name.toLowerCase())) { skipped++; continue; }
            Church existing = repo.findFirstByNameIgnoreCase(name).orElse(null);
            if (existing != null) {
                if (sub != null && (existing.getSubCity() == null || existing.getSubCity().isBlank())) { existing.setSubCity(sub); updated++; } else skipped++;
                continue;
            }
            Church c = new Church();
            c.setName(name);
            c.setSubCity(sub);
            repo.save(c);
            added++;
        }
        return new BulkResult(added, skipped, updated);
    }

    private static String blank(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}
