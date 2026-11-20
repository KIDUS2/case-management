package com.churchdesk.dto.response;

import java.time.LocalDate;
import java.util.List;

/** Someone with an appointment: the day they are expected and their numbered spot on that day. */
public record QueueItem(Long caseId, String code, LocalDate returnOn, List<String> people, String churchName,
                        List<String> departments, int issues, Integer spotNo) {}
