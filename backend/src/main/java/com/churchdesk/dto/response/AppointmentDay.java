package com.churchdesk.dto.response;

import java.time.LocalDate;

/** One day in the appointment book: how many spots there are and how many are still free. */
public record AppointmentDay(LocalDate date, boolean open, int capacity, int booked, int left) {}
