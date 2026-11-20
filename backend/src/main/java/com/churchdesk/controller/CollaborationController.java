package com.churchdesk.controller;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.churchdesk.dto.request.InvestigationRequest;
import com.churchdesk.dto.request.SubcityReferralRequest;
import com.churchdesk.dto.request.TextRequest;
import com.churchdesk.dto.response.InvestigationDto;
import com.churchdesk.dto.response.SubcityReferralDto;
import com.churchdesk.security.CurrentUser;
import com.churchdesk.service.InvestigationService;
import com.churchdesk.service.SubcityReferralService;

/** Work shared with other groups: the investigation committee and the sub-cities. */
@RestController
@RequestMapping("/api")
public class CollaborationController {
    private static final String DIOCESE = "hasAnyRole('ADMIN','OFFICER','SERA_ASKIYAJIE','PAPAS')";
    private final InvestigationService investigations;
    private final SubcityReferralService subcity;
    private final CurrentUser current;
    private final com.churchdesk.repository.UserRepository userRepo;

    public CollaborationController(InvestigationService investigations, SubcityReferralService subcity, CurrentUser current,
                                  com.churchdesk.repository.UserRepository userRepo) {
        this.userRepo = userRepo; this.investigations = investigations; this.subcity = subcity; this.current = current;
    }

    // ---- investigation committee ----

    @GetMapping("/cases/{id}/investigations")
    public List<InvestigationDto> investigationsOf(@PathVariable Long id, Authentication auth) { return investigations.forCase(id, current.get(auth)); }

    @PostMapping("/cases/{id}/investigations") @PreAuthorize(DIOCESE)
    public InvestigationDto ask(@PathVariable Long id, @Valid @RequestBody InvestigationRequest r, Authentication auth) { return investigations.ask(id, r, current.get(auth)); }

    @PostMapping("/investigations/{id}/report")
    public InvestigationDto report(@PathVariable Long id, @Valid @RequestBody TextRequest r, Authentication auth) { return investigations.report(id, r.text(), current.get(auth)); }

    @PostMapping("/investigations/{id}/close") @PreAuthorize(DIOCESE)
    public InvestigationDto closeInvestigation(@PathVariable Long id, Authentication auth) { return investigations.close(id, current.get(auth)); }

    /** Who can be given a committee report to write: every active account except sub-city offices. */
    @GetMapping("/investigations/people") @PreAuthorize(DIOCESE)
    public List<java.util.Map<String, String>> people() {
        return userRepo.findAll().stream().filter(u -> u.isActive() && u.getRole() != com.churchdesk.enums.Role.SUBCITY)
                .map(u -> java.util.Map.of("username", u.getUsername(), "fullName", u.getFullName(), "role", u.getRole().name())).toList();
    }

    @GetMapping("/investigations/waiting")
    public List<InvestigationDto> investigationsWaiting(Authentication auth) { return investigations.waiting(current.get(auth)); }

    // ---- sub-city ----

    @GetMapping("/cases/{id}/subcity-referrals")
    public List<SubcityReferralDto> referralsOf(@PathVariable Long id, Authentication auth) { return subcity.forCase(id, current.get(auth)); }

    @PostMapping("/cases/{id}/subcity-referrals") @PreAuthorize(DIOCESE)
    public SubcityReferralDto send(@PathVariable Long id, @Valid @RequestBody SubcityReferralRequest r, Authentication auth) { return subcity.send(id, r, current.get(auth)); }

    @PostMapping("/subcity-referrals/{id}/solution")
    public SubcityReferralDto solve(@PathVariable Long id, @Valid @RequestBody TextRequest r, Authentication auth) { return subcity.solve(id, r.text(), current.get(auth)); }

    @PostMapping("/subcity-referrals/{id}/close") @PreAuthorize(DIOCESE)
    public SubcityReferralDto closeReferral(@PathVariable Long id, Authentication auth) { return subcity.close(id, current.get(auth)); }

    @GetMapping("/subcity-referrals/waiting")
    public List<SubcityReferralDto> referralsWaiting(Authentication auth) { return subcity.waiting(current.get(auth)); }
}
