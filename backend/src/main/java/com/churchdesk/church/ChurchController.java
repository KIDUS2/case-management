package com.churchdesk.church;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/churches")
public class ChurchController {
    public record ChurchDto(Long id, String name, String subCity) {}
    public record CreateChurch(@NotBlank @Size(max = 160) String name, @Size(max = 80) String subCity) {}
    public record UpdateChurch(@Size(max = 80) String subCity) {}
    public record BulkItem(@NotBlank @Size(max = 160) String name, @Size(max = 80) String subCity) {}
    public record BulkRequest(@Size(max = 2000) List<String> names, @Size(max = 2000) List<@jakarta.validation.Valid BulkItem> items) {}
    public record BulkResult(int added, int skipped, int updated) {}

    private final ChurchRepository repo;
    private final com.churchdesk.option.OptionService options;
    public ChurchController(ChurchRepository repo, com.churchdesk.option.OptionService options) { this.repo = repo; this.options = options; }

    @GetMapping
    public List<ChurchDto> list() {
        return repo.findAllByOrderByNameAsc().stream().map(c -> new ChurchDto(c.getId(), c.getName(), c.getSubCity())).toList();
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('ADMIN')")
    public ChurchDto create(@Valid @RequestBody CreateChurch r) {
        String name = r.name().trim();
        if (repo.existsByNameIgnoreCase(name)) throw new ResponseStatusException(HttpStatus.CONFLICT, "That church is already in the list");
        Church c = new Church();
        c.setName(name);
        c.setSubCity(options.requireSubCity(r.subCity()));
        c = repo.save(c);
        return new ChurchDto(c.getId(), c.getName(), c.getSubCity());
    }

    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") @Transactional
    public ChurchDto update(@PathVariable Long id, @Valid @RequestBody UpdateChurch r) {
        Church c = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Church not found"));
        c.setSubCity(options.requireSubCity(r.subCity()));
        return new ChurchDto(c.getId(), c.getName(), c.getSubCity());
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
