package com.churchdesk.dto.response;

import java.time.LocalDate;
import java.util.List;

/** Someone expected back at the door. */
public record QueueItem(Long caseId, String code, LocalDate returnOn, List<String> people, String churchName,
                        List<String> departments, int issues) {}
