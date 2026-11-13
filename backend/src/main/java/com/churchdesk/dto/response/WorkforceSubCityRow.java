package com.churchdesk.dto.response;

import java.math.BigDecimal;
import java.util.*;

public record WorkforceSubCityRow(String name, long churches, long employees, long leaders, BigDecimal payroll) {}
