package com.churchdesk.model;

import jakarta.persistence.*;
import java.time.Instant;

/** Something the church owns or runs on its grounds: a hall, a school, a clinic, a cemetery. */
@Entity
@Table(name = "church_facility")
public class ChurchFacility {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "church_id", nullable = false) private Long churchId;
    @Column(nullable = false) private String kind;
    private String name;
    private Integer capacity;
    @Column(name = "facility_condition") private String condition;
    private String notes;
    @Column(name = "created_by", nullable = false) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Long getChurchId() { return churchId; }
    public void setChurchId(Long v) { churchId = v; }
    public String getKind() { return kind; }
    public void setKind(String v) { kind = v; }
    public String getName() { return name; }
    public void setName(String v) { name = v; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer v) { capacity = v; }
    public String getCondition() { return condition; }
    public void setCondition(String v) { condition = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { notes = v; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String v) { createdBy = v; }
    public Instant getCreatedAt() { return createdAt; }
}
