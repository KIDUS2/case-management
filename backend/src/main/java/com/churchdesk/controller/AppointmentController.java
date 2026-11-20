package com.churchdesk.controller;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.churchdesk.dto.request.AppointmentSettingsRequest;
import com.churchdesk.dto.response.AppointmentDay;
import com.churchdesk.dto.response.AppointmentSettingsDto;
import com.churchdesk.dto.response.SmsLogItem;
import com.churchdesk.security.CurrentUser;
import com.churchdesk.service.AppointmentService;
import com.churchdesk.service.SmsService;

/** The appointment book (spots per day) and the text messages sent about a case. */
@RestController
@RequestMapping("/api")
public class AppointmentController {
    private static final String STAFF = "hasAnyRole('ADMIN','OFFICER','RECEPTION')";
    private final AppointmentService appointments;
    private final SmsService sms;
    private final CurrentUser current;

    public AppointmentController(AppointmentService appointments, SmsService sms, CurrentUser current) {
        this.appointments = appointments; this.sms = sms; this.current = current;
    }

    /** Which days have spots left, starting from today (or the given day). */
    @GetMapping("/appointments/days") @PreAuthorize(STAFF)
    public List<AppointmentDay> days(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                     @RequestParam(defaultValue = "21") int count) {
        return appointments.days(from, count);
    }

    @GetMapping("/appointments/settings") @PreAuthorize(STAFF)
    public AppointmentSettingsDto settings() { return appointments.currentSettings(sms.mode()); }

    @PutMapping("/appointments/settings") @PreAuthorize("hasRole('ADMIN')")
    public AppointmentSettingsDto saveSettings(@Valid @RequestBody AppointmentSettingsRequest r) {
        appointments.saveSettings(r);
        return appointments.currentSettings(sms.mode());
    }

    @GetMapping("/cases/{id}/sms") @PreAuthorize(STAFF)
    public List<SmsLogItem> history(@PathVariable Long id, Authentication auth) { return sms.history(id, current.get(auth)); }

    @PostMapping("/cases/{id}/sms") @PreAuthorize(STAFF)
    public Map<String, Integer> resend(@PathVariable Long id, Authentication auth) {
        return Map.of("sent", sms.resend(id, current.get(auth)));
    }
}
