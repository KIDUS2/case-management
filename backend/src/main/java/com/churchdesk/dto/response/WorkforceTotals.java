package com.churchdesk.dto.response;

import java.math.BigDecimal;
import java.util.*;

public record WorkforceTotals(long churches, long employees, long leaders, long withoutSalary, BigDecimal payroll) {}
