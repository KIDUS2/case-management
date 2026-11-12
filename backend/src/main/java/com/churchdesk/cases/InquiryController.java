package com.churchdesk.cases;

import com.churchdesk.cases.InquiryService.InquiryDto;
import com.churchdesk.user.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class InquiryController {
    public record AskRequest(Long issueId, @NotBlank @Size(max = 4000) String question) {}
    public record FindingRequest(@NotBlank @Size(max = 6000) String finding) {}
    public record DecisionRequest(@NotBlank @Size(max = 6000) String decision, boolean churchAgreed) {}

    private final InquiryService service;
    private final CurrentUser current;
    public InquiryController(InquiryService service, CurrentUser current) { this.service = service; this.current = current; }

    @GetMapping("/cases/{id}/inquiries")
    public List<InquiryDto> forCase(@PathVariable Long id, Authentication auth) { return service.forCase(id, current.get(auth)); }

    @GetMapping("/inquiries/waiting")
    public List<InquiryDto> waiting(Authentication auth) { return service.waitingForAdmin(current.get(auth)); }

    @PostMapping("/cases/{id}/inquiries") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER','RECEPTION','DEPARTMENT')")
    public InquiryDto ask(@PathVariable Long id, @Valid @RequestBody AskRequest r, Authentication auth) {
        return service.ask(id, r.issueId(), r.question(), current.get(auth));
    }

    @PostMapping("/inquiries/{id}/finding") @PreAuthorize("hasAnyRole('ADMIN','OFFICER','RECEPTION')")
    public InquiryDto finding(@PathVariable Long id, @Valid @RequestBody FindingRequest r, Authentication auth) {
        return service.recordFinding(id, r.finding(), current.get(auth));
    }

    @PostMapping("/inquiries/{id}/decision") @PreAuthorize("hasRole('ADMIN')")
    public InquiryDto decision(@PathVariable Long id, @Valid @RequestBody DecisionRequest r, Authentication auth) {
        return service.decide(id, r.decision(), r.churchAgreed(), current.get(auth));
    }
}
