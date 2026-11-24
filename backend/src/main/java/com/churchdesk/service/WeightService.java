package com.churchdesk.service;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** The default weight (how much time it takes) of each issue type. The administrator sets it in Settings. */
@Service
public class WeightService {
    public static final int MIN = 1, MAX = 10;
    private final SettingService settings;
    private final OptionService options;

    public WeightService(SettingService settings, OptionService options) { this.settings = settings; this.options = options; }

    private static String key(String code) { return "weight." + code; }

    @Transactional(readOnly = true)
    public int forCategory(String code) { return Math.max(MIN, Math.min(MAX, settings.getInt(key(code), MIN))); }

    /** Issue type code -> weight, for every type that can be chosen today. */
    @Transactional(readOnly = true)
    public Map<String, Integer> all() {
        Map<String, Integer> m = new LinkedHashMap<>();
        for (String code : options.activeIssueTypes()) m.put(code, forCategory(code));
        return m;
    }

    @Transactional
    public void save(Map<String, Integer> w) {
        var valid = options.issueTypeLabels().keySet();
        for (var e : w.entrySet()) {
            if (!valid.contains(e.getKey())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown case type: " + e.getKey());
            if (e.getValue() == null || e.getValue() < MIN || e.getValue() > MAX)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The weight must be between " + MIN + " and " + MAX);
        }
        for (var e : w.entrySet()) settings.put(key(e.getKey()), String.valueOf(e.getValue()));
    }
}
