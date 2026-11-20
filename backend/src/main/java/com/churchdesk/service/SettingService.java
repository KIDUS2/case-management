package com.churchdesk.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.churchdesk.model.AppSetting;
import com.churchdesk.repository.AppSettingRepository;

/** Small settings the administrator can change without touching the server. */
@Service
public class SettingService {
    private final AppSettingRepository repo;

    public SettingService(AppSettingRepository repo) { this.repo = repo; }

    @Transactional(readOnly = true)
    public String get(String key, String fallback) {
        return repo.findById(key).map(AppSetting::getValue).orElse(fallback);
    }

    @Transactional(readOnly = true)
    public int getInt(String key, int fallback) {
        try { return Integer.parseInt(get(key, String.valueOf(fallback)).trim()); }
        catch (NumberFormatException e) { return fallback; }
    }

    @Transactional
    public void put(String key, String value) {
        AppSetting s = repo.findById(key).orElse(null);
        if (s == null) repo.save(new AppSetting(key, value)); else s.setValue(value);
    }
}
