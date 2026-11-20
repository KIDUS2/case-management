package com.churchdesk.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import com.churchdesk.dto.response.PublicCaseStatus;
import com.churchdesk.enums.AppointmentStatus;
import com.churchdesk.enums.PartyRole;
import com.churchdesk.enums.ReviewStatus;
import com.churchdesk.model.Appointment;
import com.churchdesk.model.ChurchCase;
import com.churchdesk.model.Person;
import com.churchdesk.repository.AppointmentRepository;
import com.churchdesk.repository.ChurchCaseRepository;

/**
 * Lets the person who got a case number by SMS check how the case is going. They must give the case number AND the
 * phone number they registered with, and only a few tries are allowed, so nobody can guess their way into a case.
 */
@Service
public class PublicStatusService {
    private static final int MAX_TRIES = 8;
    private static final long WINDOW_MS = 15 * 60_000L;

    private final ChurchCaseRepository cases;
    private final AppointmentRepository appointments;
    private final AuditService audit;
    private final Map<String, Deque<Long>> tries = new ConcurrentHashMap<>();

    public PublicStatusService(ChurchCaseRepository cases, AppointmentRepository appointments, AuditService audit) {
        this.cases = cases; this.appointments = appointments; this.audit = audit;
    }

    @Transactional(readOnly = true)
    public PublicCaseStatus lookup(String rawCode, String rawPhone, String who) {
        throttle(who);
        String code = rawCode.replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
        String phone = last9(rawPhone);
        ChurchCase c = phone == null ? null : cases.findByCode(code).filter(x -> belongsTo(x, phone)).orElse(null);
        if (c == null) {
            audit.record("public", "STATUS_MISS", "CASE", code, null);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "We could not find a case with that number and phone number. Please check both.");
        }
        audit.record("public", "STATUS_LOOKUP", "CASE", code, null);
        List<PublicCaseStatus.IssueLine> lines = c.getIssues().stream().map(i -> new PublicCaseStatus.IssueLine(i.getCategory(), i.getStatus().name())).toList();
        int resolved = (int) c.getIssues().stream().filter(i -> i.getStatus().name().equals("RESOLVED")).count();
        Appointment next = appointments.findByCaseIdAndStatus(c.getId(), AppointmentStatus.BOOKED).stream()
                .filter(a -> !a.getDate().isBefore(com.churchdesk.util.Times.today())).min((a, b) -> a.getDate().compareTo(b.getDate())).orElse(null);
        return new PublicCaseStatus(c.getCode(), c.getStatus().name(), c.getIssues().size(), resolved,
                next == null ? null : next.getDate(), next == null ? null : next.getSpotNo(), lines, c.getReviewStatus() == ReviewStatus.PENDING);
    }

    private static boolean belongsTo(ChurchCase c, String last9) {
        return c.getParties().stream().filter(p -> p.getRole() == PartyRole.COMPLAINANT).map(p -> p.getPerson()).anyMatch(per -> hasPhone(per, last9));
    }

    private static boolean hasPhone(Person p, String last9) {
        if (last9.equals(last9(p.getPhone()))) return true;
        return p.getExtraPhoneList().stream().anyMatch(x -> last9.equals(last9(x)));
    }

    private static String last9(String raw) {
        if (raw == null) return null;
        String d = raw.replaceAll("[^0-9]", "");
        return d.length() < 9 ? null : d.substring(d.length() - 9);
    }

    private void throttle(String who) {
        long now = Instant.now().toEpochMilli();
        Deque<Long> q = tries.computeIfAbsent(who, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > WINDOW_MS) q.pollFirst();
            if (q.size() >= MAX_TRIES) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many tries. Please wait a few minutes and try again.");
            q.addLast(now);
        }
        if (tries.size() > 5000) tries.entrySet().removeIf(e -> e.getValue().isEmpty());
    }
}
