package com.churchdesk.dto.response;

import java.util.Map;

/** Where the trouble is: one row per kefle ketema or per church, with its issue types. Cases and issues are counted by the church of the person who brought the case. */
public record Hotspot(String name, String subCity, long cases, long issues, long resolved, Map<String, Long> byCategory) {}
