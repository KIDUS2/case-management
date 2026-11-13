package com.churchdesk.dto.response;

import java.util.List;

public record InboxDto(List<InboxItem> items, long total, int page, int size, long pending) {}
