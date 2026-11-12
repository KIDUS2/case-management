package com.churchdesk.cases;

import com.churchdesk.church.Church;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import java.time.Instant;

@Entity
@Table(name = "person")
@BatchSize(size = 50)
public class Person {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "full_name", nullable = false) private String fullName;
    private String phone;
    @Column(name = "profession") private String profession;
    @Column(name = "position") private String position;
    @Column(name = "gender") private String gender;
    @Column(name = "birth_date") private java.time.LocalDate birthDate;
    @Column(name = "hire_date") private java.time.LocalDate hireDate;
    @Column(name = "address") private String address;
    @Column(name = "email") private String email;
    @Column(name = "notes") private String notes;
    @Column(name = "employee_id") private String employeeId;
    @Column(name = "church_ref") private String churchRef;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "church_id", nullable = false) private Church church;
    @Enumerated(EnumType.STRING) @Column(name = "working_status", nullable = false) private WorkingStatus workingStatus;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String v) { fullName = v; }
    public String getChurchRef() { return churchRef; }
    public void setChurchRef(String v) { churchRef = v; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String v) { employeeId = v; }
    public String getProfession() { return profession; }
    public void setProfession(String v) { profession = v; }
    public String getPosition() { return position; }
    public void setPosition(String v) { position = v; }
    public String getGender() { return gender; }
    public void setGender(String v) { gender = v; }
    public java.time.LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(java.time.LocalDate v) { birthDate = v; }
    public java.time.LocalDate getHireDate() { return hireDate; }
    public void setHireDate(java.time.LocalDate v) { hireDate = v; }
    public String getAddress() { return address; }
    public void setAddress(String v) { address = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { email = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { notes = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { phone = v; }
    public Church getChurch() { return church; }
    public void setChurch(Church v) { church = v; }
    public WorkingStatus getWorkingStatus() { return workingStatus; }
    public void setWorkingStatus(WorkingStatus v) { workingStatus = v; }
}
