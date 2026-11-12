package com.churchdesk.cases;

import com.churchdesk.church.Church;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "person")
public class Person {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "full_name", nullable = false) private String fullName;
    private String phone;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "church_id", nullable = false) private Church church;
    @Enumerated(EnumType.STRING) @Column(name = "working_status", nullable = false) private WorkingStatus workingStatus;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String v) { fullName = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { phone = v; }
    public Church getChurch() { return church; }
    public void setChurch(Church v) { church = v; }
    public WorkingStatus getWorkingStatus() { return workingStatus; }
    public void setWorkingStatus(WorkingStatus v) { workingStatus = v; }
}
