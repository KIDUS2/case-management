package com.churchdesk.church;

import jakarta.persistence.*;
import java.time.Instant;

/** A document kept for a church: the carta (land title), a map, a letter, a photo. */
@Entity
@Table(name = "church_file")
public class ChurchFile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "church_id", nullable = false) private Long churchId;
    @Column(nullable = false) private String kind;
    @Column(nullable = false) private String title;
    @Column(name = "original_name", nullable = false) private String originalName;
    @Column(name = "stored_name", nullable = false) private String storedName;
    @Column(name = "content_type") private String contentType;
    @Column(name = "size_bytes", nullable = false) private long sizeBytes;
    @Column(name = "uploaded_by", nullable = false) private String uploadedBy;
    @Column(name = "uploaded_at", nullable = false) private Instant uploadedAt = Instant.now();

    public Long getId() { return id; }
    public Long getChurchId() { return churchId; }
    public void setChurchId(Long v) { churchId = v; }
    public String getKind() { return kind; }
    public void setKind(String v) { kind = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { title = v; }
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
