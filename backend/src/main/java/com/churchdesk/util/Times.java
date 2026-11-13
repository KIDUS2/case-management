package com.churchdesk.util;

import java.time.LocalDate;
import java.time.ZoneId;

public final class Times {
    public static final ZoneId ZONE = ZoneId.of("Africa/Addis_Ababa");
    private Times() {}
    public static LocalDate today() { return LocalDate.now(ZONE); }
}
