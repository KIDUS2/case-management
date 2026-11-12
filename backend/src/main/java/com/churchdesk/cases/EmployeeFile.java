package com.churchdesk.cases;

import jakarta.persistence.*;
import java.time.Instant;

/** A document kept in the employee's file: appointment letter, certificate, ID copy, and so on. */
@Entity
@Table(name = "employee_file")
public class EmployeeFile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "person_id", nullable = false) private Long personId;
    @Column(nullable = false) private String title;
    private String kind;
    @Column(name = "original_name", nullable = false) private String originalName;
    @Column(name = "stored_name", nullable = false) private String storedName;
    @Column(name = "content_type") private String contentType;
    @Column(name = "size_bytes", nullable = false) private long sizeBytes;
    @Column(name = "uploaded_by", nullable = false) private String uploadedBy;
    @Column(name = "uploaded_at", nullable = false) private Instant uploadedAt = Instant.now();

    public Long getId() { return id; }
    public Long getPersonId() { return personId; }
    public void setPersonId(Long v) { personId = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { title = v; }
    public String getKind() { return kind; }
    public void setKind(String v) { kind = v; }
    public String getOriginalName() { return originalName; }
    public void setOriginalName(String v) { originalName = v; }
    public String getStoredName() { return storedName; }
    public void setStoredName(String v) { storedName = v; }
    public String getContentType() { return contentType; }
    public void setContentType(String v) { contentType = v; }
    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long v) { sizeBytes = v; }
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String v) { uploadedBy = v; }
    public Instant getUploadedAt() { return uploadedAt; }
}
