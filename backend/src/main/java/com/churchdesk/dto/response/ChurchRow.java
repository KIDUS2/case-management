package com.churchdesk.dto.response;

import java.math.BigDecimal;
import java.util.*;

public record ChurchRow(Long id, String name, String subCity, long employees, long leaders, long withoutSalary, BigDecimal payroll,
                        List<PositionRow> positions, List<WorkforceLeader> leaderList) {}
