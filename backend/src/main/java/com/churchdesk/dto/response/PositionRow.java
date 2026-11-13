package com.churchdesk.dto.response;

import java.math.BigDecimal;
import java.util.*;

public record PositionRow(String position, long employees, BigDecimal payroll) {}
