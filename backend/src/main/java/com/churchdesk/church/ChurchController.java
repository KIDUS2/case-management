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
    public record ChurchDto(Long id, String name) {}
    public record CreateChurch(@NotBlank @Size(max = 160) String name) {}
    public record BulkRequest(@NotNull @Size(max = 2000) List<String> names) {}
    public record BulkResult(int added, int skipped) {}

    private final ChurchRepository repo;
    public ChurchController(ChurchRepository repo) { this.repo = repo; }

    @GetMapping
    public List<ChurchDto> list() {
        return repo.findAllByOrderByNameAsc().stream().map(c -> new ChurchDto(c.getId(), c.getName())).toList();
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasRole('ADMIN')")
    public ChurchDto create(@Valid @RequestBody CreateChurch r) {
        String name = r.name().trim();
        if (repo.existsByNameIgnoreCase(name)) throw new ResponseStatusException(HttpStatus.CONFLICT, "That church is already in the list");
        Church c = new Church();
        c.setName(name);
        c = repo.save(c);
        return new ChurchDto(c.getId(), c.getName());
    }

    /** Paste many names (one per line); names that already exist are skipped. */
    @PostMapping("/bulk") @PreAuthorize("hasRole('ADMIN')") @Transactional
    public BulkResult bulk(@Valid @RequestBody BulkRequest r) {
        Set<String> seen = new HashSet<>();
        int added = 0, skipped = 0;
        for (String raw : r.names()) {
            String name = raw == null ? "" : raw.trim();
            if (name.isEmpty()) continue;
            if (name.length() > 160 || !seen.add(name.toLowerCase()) || repo.existsByNameIgnoreCase(name)) { skipped++; continue; }
            Church c = new Church();
            c.setName(name);
            repo.save(c);
            added++;
        }
        return new BulkResult(added, skipped);
    }
}
