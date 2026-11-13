package com.churchdesk.dto.response;

/** Work still to do: people expected at the door, and court cases the admin has not yet acknowledged. */
public record Flow(long expectedToday, long overdue, long courtUnacknowledged, long waitingInDepartments) {}
