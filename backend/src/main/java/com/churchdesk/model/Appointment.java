package com.churchdesk.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import com.churchdesk.enums.AppointmentStatus;

@Entity
@Table(name = "appointment")
public class Appointment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "case_id", nullable = false) private Long caseId;
    @Column(name = "appt_date", nullable = false) private LocalDate date;
    @Column(name = "spot_no", nullable = false) private int spotNo;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private AppointmentStatus status = AppointmentStatus.BOOKED;
    @Column(name = "created_by") private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected Appointment() {}
    public Appointment(Long caseId, LocalDate date, int spotNo, String createdBy) {
        this.caseId = caseId; this.date = date; this.spotNo = spotNo; this.createdBy = createdBy;
    }
    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public LocalDate getDate() { return date; }
    public int getSpotNo() { return spotNo; }
    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus s) { status = s; }
}
