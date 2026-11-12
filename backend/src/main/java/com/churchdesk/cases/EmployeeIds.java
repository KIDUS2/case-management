package com.churchdesk.cases;

import java.security.SecureRandom;
import java.util.function.Predicate;

/**
 * Employee ID: 12 digits, written 1234 5678 9012, like a national ID card.
 * 11 random digits (no meaning, nothing about the person, cannot be guessed in order) plus a Verhoeff check digit,
 * so a mistyped or swapped digit is caught before anyone looks anything up.
 */
public final class EmployeeIds {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int[][] D = {
        {0,1,2,3,4,5,6,7,8,9},{1,2,3,4,0,6,7,8,9,5},{2,3,4,0,1,7,8,9,5,6},{3,4,0,1,2,8,9,5,6,7},{4,0,1,2,3,9,5,6,7,8},
        {5,9,8,7,6,0,4,3,2,1},{6,5,9,8,7,1,0,4,3,2},{7,6,5,9,8,2,1,0,4,3},{8,7,6,5,9,3,2,1,0,4},{9,8,7,6,5,4,3,2,1,0}};
    private static final int[][] P = {
        {0,1,2,3,4,5,6,7,8,9},{1,5,7,6,2,8,3,0,9,4},{5,8,0,3,7,9,6,1,4,2},{8,9,1,6,0,4,3,5,2,7},
        {9,4,5,3,1,2,6,8,7,0},{4,2,8,6,5,7,3,9,0,1},{2,7,9,3,8,0,6,4,1,5},{7,0,4,6,9,1,3,2,5,8}};
    private static final int[] INV = {0,4,3,2,1,5,6,7,8,9};

    private EmployeeIds() {}

    /** Digits only: removes spaces, dashes and anything else typed by hand. */
    public static String normalize(String s) { return s == null ? "" : s.replaceAll("[^0-9A-Za-z]", "").toUpperCase(); }

    public static boolean looksLikeId(String s) { return normalize(s).matches("\\d{12}"); }

    public static boolean isValid(String s) {
        String n = normalize(s);
        if (!n.matches("\\d{12}")) return false;
        int c = 0;
        for (int i = 0; i < n.length(); i++) c = D[c][P[i % 8][n.charAt(n.length() - 1 - i) - '0']];
        return c == 0;
    }

    private static int checkDigit(String eleven) {
        int c = 0;
        for (int i = 0; i < eleven.length(); i++) c = D[c][P[(i + 1) % 8][eleven.charAt(eleven.length() - 1 - i) - '0']];
        return INV[c];
    }

    /** A fresh ID that is not used yet. */
    public static String generate(Predicate<String> taken) {
        for (int attempt = 0; attempt < 50; attempt++) {
            StringBuilder sb = new StringBuilder().append(1 + RANDOM.nextInt(9));
            for (int i = 0; i < 10; i++) sb.append(RANDOM.nextInt(10));
            String id = sb.toString() + checkDigit(sb.toString());
            if (!taken.test(id)) return id;
        }
        throw new IllegalStateException("Could not create a free employee ID");
    }
}
