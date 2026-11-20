package com.churchdesk.dto.response;

import java.time.Instant;

public record SmsLogItem(String phone, String body, String status, String error, Instant sentAt) {}
