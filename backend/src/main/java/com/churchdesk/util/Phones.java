package com.churchdesk.util;

/** Turns the phone numbers people type (0911..., +251911..., 911...) into the 251911... form SMS providers expect. */
public final class Phones {
    private Phones() {}

    /** Returns the number in 251XXXXXXXXX form, or null if it does not look like an Ethiopian mobile number. */
    public static String toInternational(String raw) {
        if (raw == null) return null;
        String d = raw.replaceAll("[^0-9]", "");
        if (d.startsWith("251") && d.length() == 12) return d;
        if (d.startsWith("0") && d.length() == 10) return "251" + d.substring(1);
        if (d.length() == 9 && (d.startsWith("9") || d.startsWith("7"))) return "251" + d;
        return null;
    }
}
