package com.churchdesk.cases;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "case_file")
public class CaseFile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "case_id", nullable = false) private Long caseId;
    @Column(name = "original_name", nullable = false) private String originalName;
    @Column(name = "stored_name", nullable = false, unique = true) private String storedName;
    @Column(name = "content_type") private String contentType;
    @Column(name = "size_bytes", nullable = false) private long sizeBytes;
    @Column(name = "uploaded_by", nullable = false) private String uploadedBy;
    @Column(name = "uploaded_at", nullable = false) private Instant uploadedAt = Instant.now();

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long v) { caseId = v; }
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
