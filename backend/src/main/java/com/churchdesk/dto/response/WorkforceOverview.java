package com.churchdesk.dto.response;

import java.util.*;

public record WorkforceOverview(WorkforceTotals totals, List<WorkforceSubCityRow> subCities, List<ChurchRow> churches) {}
