package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.churchdesk.model.AppSetting;

public interface AppSettingRepository extends JpaRepository<AppSetting, String> {}
