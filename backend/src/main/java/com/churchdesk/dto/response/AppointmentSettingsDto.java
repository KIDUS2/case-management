package com.churchdesk.dto.response;

import java.util.List;

public record AppointmentSettingsDto(int capacity, List<String> openDays, String smsLanguage, String smsMode) {}
