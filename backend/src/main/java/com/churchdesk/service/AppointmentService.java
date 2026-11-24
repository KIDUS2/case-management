package com.churchdesk.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import com.churchdesk.dto.request.AppointmentSettingsRequest;
import com.churchdesk.dto.response.AppointmentDay;
import com.churchdesk.dto.response.AppointmentSettingsDto;
import com.churchdesk.enums.AppointmentStatus;
import com.churchdesk.model.Appointment;
import com.churchdesk.repository.AppointmentRepository;
import com.churchdesk.util.Times;

/**
 * The appointment book. Every day has a fixed number of numbered spots; a spot can only be given out if that
 * day still has one free. A case holds at most one spot per day.
 */
@Service
public class AppointmentService {
    static final String CAPACITY = "appointment.capacity";
    static final String OPEN_DAYS = "appointment.open_days";
    static final String SMS_LANGUAGE = "sms.language";
    static final String NOTIFY_CHANNEL = "notify.channel";
    private static final List<String> WEEK = List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");

    private final AppointmentRepository repo;
    private final SettingService settings;

    public AppointmentService(AppointmentRepository repo, SettingService settings) {
        this.repo = repo; this.settings = settings;
    }

    // ---- what the desk sees ----

    @Transactional(readOnly = true)
    public List<AppointmentDay> days(LocalDate from, int count) {
        LocalDate start = from == null || from.isBefore(Times.today()) ? Times.today() : from;
        int n = Math.min(Math.max(count, 1), 60);
        LocalDate end = start.plusDays(n - 1);
        Map<LocalDate, Integer> booked = new HashMap<>();
        for (Object[] row : repo.countByDay(start, end, AppointmentStatus.CANCELLED))
            booked.put((LocalDate) row[0], ((Number) row[1]).intValue());
        int cap = capacity();
        Set<String> open = openDays();
        List<AppointmentDay> out = new ArrayList<>();
        for (int k = 0; k < n; k++) {
            LocalDate d = start.plusDays(k);
            boolean isOpen = open.contains(code(d.getDayOfWeek()));
            int b = booked.getOrDefault(d, 0);
            out.add(new AppointmentDay(d, isOpen, cap, b, isOpen ? Math.max(cap - b, 0) : 0));
        }
        return out;
    }

    public int capacity() { return settings.getInt(CAPACITY, 30); }

    public Set<String> openDays() {
        String raw = settings.get(OPEN_DAYS, "MON,TUE,WED,THU,FRI");
        Set<String> s = new HashSet<>();
        for (String p : raw.split(",")) if (!p.isBlank()) s.add(p.trim().toUpperCase(Locale.ROOT));
        return s;
    }

    @Transactional(readOnly = true)
    public AppointmentSettingsDto currentSettings(String smsMode, String emailMode) {
        Set<String> open = openDays();
        return new AppointmentSettingsDto(capacity(), WEEK.stream().filter(open::contains).toList(),
                settings.get(SMS_LANGUAGE, "BOTH"), smsMode, settings.get(NOTIFY_CHANNEL, "SMS"), emailMode);
    }

    @Transactional
    public void saveSettings(AppointmentSettingsRequest r) {
        List<String> days = r.openDays().stream().map(d -> d.trim().toUpperCase(Locale.ROOT)).toList();
        for (String d : days) if (!WEEK.contains(d)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown day: " + d);
        settings.put(CAPACITY, String.valueOf(r.capacity()));
        settings.put(OPEN_DAYS, String.join(",", days));
        if (r.smsLanguage() != null) settings.put(SMS_LANGUAGE, r.smsLanguage());
        if (r.notifyChannel() != null) settings.put(NOTIFY_CHANNEL, r.notifyChannel());
    }

    // ---- booking ----

    /**
     * Gives the case a spot on the day. If it already holds one that day it keeps it. Fails with a clear message if
     * the day is closed, full, or in the past.
     */
    @Transactional
    public Appointment book(Long caseId, LocalDate day, String by) {
        if (day.isBefore(Times.today()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The appointment day cannot be in the past");
        if (!openDays().contains(code(day.getDayOfWeek())))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "We do not give appointments on " + day + ". Please choose a working day.");
        Appointment existing = repo.findFirstByCaseIdAndDateAndStatusNot(caseId, day, AppointmentStatus.CANCELLED).orElse(null);
        if (existing != null) return existing;
        List<Integer> taken = repo.takenSpots(day, AppointmentStatus.CANCELLED);
        int cap = capacity();
        if (taken.size() >= cap)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No spots are left on " + day + ". Please choose another day.");
        int spot = 1;
        for (int t : taken) { if (t == spot) spot++; else if (t > spot) break; }
        try {
            return repo.saveAndFlush(new Appointment(caseId, day, spot, by));
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That spot was just taken by someone else. Please try again.");
        }
    }

    /** Replaces the case's waiting appointment by one on a new day (the person asked to come on another day). */
    @Transactional
    public Appointment rebook(Long caseId, LocalDate day, String by) {
        List<Appointment> old = repo.findByCaseIdAndStatus(caseId, AppointmentStatus.BOOKED);
        boolean same = old.stream().anyMatch(a -> a.getDate().equals(day));
        if (!same) for (Appointment a : old) a.setStatus(AppointmentStatus.CANCELLED);
        return book(caseId, day, by);
    }

    /** The case no longer needs to come back. */
    @Transactional
    public void cancelFor(Long caseId) {
        for (Appointment a : repo.findByCaseIdAndStatus(caseId, AppointmentStatus.BOOKED)) a.setStatus(AppointmentStatus.CANCELLED);
    }

    /** Frees the spot the case held on that day. */
    @Transactional
    public void cancelDay(Long caseId, LocalDate day) {
        for (Appointment a : repo.findByCaseIdAndStatus(caseId, AppointmentStatus.BOOKED))
            if (a.getDate().equals(day)) a.setStatus(AppointmentStatus.CANCELLED);
    }

    @Transactional
    public void markArrived(Long caseId) {
        for (Appointment a : repo.findByCaseIdAndStatus(caseId, AppointmentStatus.BOOKED)) a.setStatus(AppointmentStatus.ARRIVED);
    }

    @Transactional(readOnly = true)
    public Integer spotFor(Long caseId, LocalDate day) {
        return repo.findFirstByCaseIdAndDateAndStatusNot(caseId, day, AppointmentStatus.CANCELLED).map(Appointment::getSpotNo).orElse(null);
    }

    private static String code(DayOfWeek d) { return WEEK.get(d.getValue() - 1); }
}
