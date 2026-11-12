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
    @Column(name = "first_name") private String firstName;
    @Column(name = "middle_name") private String middleName;
    @Column(name = "last_name") private String lastName;
    @Column(name = "mother_name") private String motherName;
    @Column(name = "christian_name") private String christianName;
    @Column(name = "father_confessor") private String fatherConfessor;
    @Column(name = "spiritual_rank") private String spiritualRank;
    @Column(name = "ordained_on") private java.time.LocalDate ordainedOn;
    @Column(name = "photo_file") private String photoFile;
    @Column(name = "id_issued_on") private java.time.LocalDate idIssuedOn;
    @Column(name = "id_expires_on") private java.time.LocalDate idExpiresOn;
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
    public String getFirstName() { return firstName; }
    public void setFirstName(String v) { firstName = v; }
    public String getMiddleName() { return middleName; }
    public void setMiddleName(String v) { middleName = v; }
    public String getLastName() { return lastName; }
    public void setLastName(String v) { lastName = v; }
    public String getMotherName() { return motherName; }
    public void setMotherName(String v) { motherName = v; }
    public String getChristianName() { return christianName; }
    public void setChristianName(String v) { christianName = v; }
    public String getFatherConfessor() { return fatherConfessor; }
    public void setFatherConfessor(String v) { fatherConfessor = v; }
    public String getSpiritualRank() { return spiritualRank; }
    public void setSpiritualRank(String v) { spiritualRank = v; }
    public java.time.LocalDate getOrdainedOn() { return ordainedOn; }
    public void setOrdainedOn(java.time.LocalDate v) { ordainedOn = v; }
    public String getPhotoFile() { return photoFile; }
    public void setPhotoFile(String v) { photoFile = v; }
    public java.time.LocalDate getIdIssuedOn() { return idIssuedOn; }
    public void setIdIssuedOn(java.time.LocalDate v) { idIssuedOn = v; }
    public java.time.LocalDate getIdExpiresOn() { return idExpiresOn; }
    public void setIdExpiresOn(java.time.LocalDate v) { idExpiresOn = v; }

    /** Gives the person their ID, valid for five years from today. */
    public void assignId(String id) {
        this.employeeId = id;
        this.idIssuedOn = Times.today();
        this.idExpiresOn = Times.today().plusYears(5);
    }

    /** First name, then father's name, then the rest (grandfather's), for people who were only typed as one line. */
    public void splitFullName() {
        if (fullName == null || firstName != null) return;
        String[] t = fullName.trim().split("\\s+", 3);
        firstName = t[0];
        if (t.length > 1) middleName = t[1];
        if (t.length > 2) lastName = t[2];
    }
    public String getPhone() { return phone; }
    public void setPhone(String v) { phone = v; }
    public Church getChurch() { return church; }
    public void setChurch(Church v) { church = v; }
    public WorkingStatus getWorkingStatus() { return workingStatus; }
    public void setWorkingStatus(WorkingStatus v) { workingStatus = v; }
}
