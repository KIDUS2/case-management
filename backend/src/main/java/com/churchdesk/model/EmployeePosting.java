package com.churchdesk.model;

import jakarta.persistence.*;
import java.time.LocalDate;

/** Where the employee served, in what role, and when. An empty end date means they still serve there. */
@Entity
@Table(name = "employee_posting")
public class EmployeePosting {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "person_id", nullable = false) private Long personId;
    @Column(nullable = false) private String place;
    private String position;
    @Column(name = "start_date") private LocalDate startDate;
    @Column(name = "end_date") private LocalDate endDate;
    private String notes;

    public Long getId() { return id; }
    public Long getPersonId() { return personId; }
    public void setPersonId(Long v) { personId = v; }
    public String getPlace() { return place; }
    public void setPlace(String v) { place = v; }
    public String getPosition() { return position; }
    public void setPosition(String v) { position = v; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate v) { startDate = v; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate v) { endDate = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { notes = v; }
}
