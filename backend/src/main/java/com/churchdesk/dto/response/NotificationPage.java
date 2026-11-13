package com.churchdesk.dto.response;

import java.util.List;

public record NotificationPage(List<NotificationDto> items, long total, int page, int size, long unread) {}
