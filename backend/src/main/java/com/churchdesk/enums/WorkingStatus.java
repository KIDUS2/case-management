package com.churchdesk.enums;

/**
 * Codes of the built-in "who the person is" entries. The list itself is managed in Settings (option list WORKING_STATUS),
 * so a person's status is stored as a plain code. CHURCH_MEMBER = a member who is not an employee;
 * LEADER_PRIEST = a leader or priest. These two carry rules, so they cannot be removed.
 */
public final class WorkingStatus {
    private WorkingStatus() {}
    public static final String ACTIVE_EMPLOYEE = "ACTIVE_EMPLOYEE", LEADER_PRIEST = "LEADER_PRIEST", RETIRED = "RETIRED",
            SUSPENDED = "SUSPENDED", CONTRACT = "CONTRACT", VOLUNTEER = "VOLUNTEER", CHURCH_MEMBER = "CHURCH_MEMBER";
}
