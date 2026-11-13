package com.churchdesk.church;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Set;

/** The facilities a church has: hall, school, clinic, cemetery and so on. */
@RestController
@RequestMapping("/api")
public class ChurchFacilityController {
    private static final String READ = "hasAnyRole('ADMIN','OFFICER','RECEPTION')";
    private static final String WRITE = "hasAnyRole('ADMIN','OFFICER')";
    private static final Set<String> KINDS = Set.of("HALL", "SCHOOL", "CLINIC", "LIBRARY", "CEMETERY", "GUEST_HOUSE", "HOLY_WATER", "RENTAL", "PARKING", "OTHER");
    private static final Set<String> CONDITIONS = Set.of("GOOD", "FAIR", "NEEDS_REPAIR");

    public record FacilityDto(Long id, String kind, String name, Integer capacity, String condition, String notes) {}
    public record FacilityRequest(@NotBlank String kind, @Size(max = 120) String name, @Min(0) @Max(1000000) Integer capacity,
                                  String condition, @Size(max = 500) String notes) {}

    private final ChurchRepository churches;
    private final ChurchFacilityRepository facilities;

    public ChurchFacilityController(ChurchRepository churches, ChurchFacilityRepository facilities) {
        this.churches = churches; this.facilities = facilities;
    }

    @GetMapping("/churches/{id}/facilities") @PreAuthorize(READ) @Transactional(readOnly = true)
    public List<FacilityDto> list(@PathVariable Long id) {
        church(id);
        return facilities.findByChurchIdOrderByIdAsc(id).stream().map(this::dto).toList();
    }

    @PostMapping("/churches/{id}/facilities") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize(WRITE) @Transactional
    public FacilityDto add(@PathVariable Long id, @Valid @RequestBody FacilityRequest r, Authentication auth) {
        church(id);
        ChurchFacility f = new ChurchFacility();
        f.setChurchId(id); f.setCreatedBy(auth.getName());
        return dto(facilities.save(apply(f, r)));
    }

    @PutMapping("/church-facilities/{fid}") @PreAuthorize(WRITE) @Transactional
    public FacilityDto edit(@PathVariable Long fid, @Valid @RequestBody FacilityRequest r) {
        return dto(apply(find(fid), r));
    }

    @DeleteMapping("/church-facilities/{fid}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize(WRITE) @Transactional
    public void delete(@PathVariable Long fid) { facilities.delete(find(fid)); }

    private ChurchFacility apply(ChurchFacility f, FacilityRequest r) {
        String kind = r.kind().trim().toUpperCase();
        if (!KINDS.contains(kind)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown facility type");
        String cond = r.condition() == null || r.condition().isBlank() ? null : r.condition().trim().toUpperCase();
        if (cond != null && !CONDITIONS.contains(cond)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown condition");
        f.setKind(kind);
        f.setName(r.name() == null || r.name().isBlank() ? null : r.name().trim());
        f.setCapacity(r.capacity()); f.setCondition(cond);
        f.setNotes(r.notes() == null || r.notes().isBlank() ? null : r.notes().trim());
        return f;
    }
    private FacilityDto dto(ChurchFacility f) { return new FacilityDto(f.getId(), f.getKind(), f.getName(), f.getCapacity(), f.getCondition(), f.getNotes()); }
    private void church(Long id) { if (!churches.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Church not found"); }
    private ChurchFacility find(Long id) { return facilities.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Facility not found")); }
}
