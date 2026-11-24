package com.churchdesk.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public record AppointmentSettingsRequest(@Min(1) @Max(500) int capacity,
                                         @NotEmpty List<String> openDays,
                                         @Pattern(regexp = "EN|AM|BOTH") String smsLanguage,
                                         @Pattern(regexp = "SMS|EMAIL|BOTH") String notifyChannel) {}
