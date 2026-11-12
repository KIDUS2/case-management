package com.churchdesk.cases;

import jakarta.persistence.*;

/** One school, college or course in an employee's life. kind is SPIRITUAL or SECULAR. */
@Entity
@Table(name = "employee_education")
public class EmployeeEducation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "person_id", nullable = false) private Long personId;
    @Column(nullable = false) private String kind;
    private String level;
    private String field;
    private String institution;
    @Column(name = "start_year") private Integer startYear;
    @Column(name = "end_year") private Integer endYear;
    @Column(nullable = false) private boolean completed = true;
    private String notes;

    public Long getId() { return id; }
    public Long getPersonId() { return personId; }
    public void setPersonId(Long v) { personId = v; }
    public String getKind() { return kind; }
    public void setKind(String v) { kind = v; }
    public String getLevel() { return level; }
    public void setLevel(String v) { level = v; }
    public String getField() { return field; }
    public void setField(String v) { field = v; }
    public String getInstitution() { return institution; }
    public void setInstitution(String v) { institution = v; }
    public Integer getStartYear() { return startYear; }
    public void setStartYear(Integer v) { startYear = v; }
    public Integer getEndYear() { return endYear; }
    public void setEndYear(Integer v) { endYear = v; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean v) { completed = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { notes = v; }
}
