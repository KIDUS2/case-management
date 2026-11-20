package com.churchdesk.util;

import java.time.LocalDate;
import java.time.ZoneId;

public final class Times {
    public static final ZoneId ZONE = ZoneId.of("Africa/Addis_Ababa");
    private Times() {}
    public static LocalDate today() { return LocalDate.now(ZONE); }
    /** First moment of the first day of a filter; no date means "from the beginning". */
    public static java.time.Instant from(LocalDate d) { return d == null ? java.time.Instant.parse("1970-01-01T00:00:00Z") : d.atStartOfDay(ZONE).toInstant(); }
    /** The moment after the last day of a filter (exclusive); no date means "to the end of time". */
    public static java.time.Instant until(LocalDate d) { return d == null ? java.time.Instant.parse("9000-01-01T00:00:00Z") : d.plusDays(1).atStartOfDay(ZONE).toInstant(); }
}
