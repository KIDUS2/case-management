package com.churchdesk.dto.response;

import java.util.*;

/** One kefle ketema (sub-city): how many cases and issues, and what kind of issues. */
public record SummarySubCityRow(String name, long cases, long issues, long resolved, Map<String, Long> byCategory) {}
