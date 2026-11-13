package com.churchdesk.dto.response;

import java.util.*;

public record Escalated(Long caseId, String code, String department, String category, String churchName, String subCity,
                        long daysLate, int level, boolean urgent) {}
