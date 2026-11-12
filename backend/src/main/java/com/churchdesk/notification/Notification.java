package com.churchdesk.notification;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notification")
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(nullable = false, length = 20) private String type;
    @Column(nullable = false, length = 200) private String title;
    @Column(columnDefinition = "text") private String body;
    @Column(name = "case_id") private Long caseId;
    @Column(name = "case_code", length = 8) private String caseCode;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "read_at") private Instant readAt;

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long v) { userId = v; }
    public String getType() { return type; }
    public void setType(String v) { type = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { title = v; }
    public String getBody() { return body; }
    public void setBody(String v) { body = v; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long v) { caseId = v; }
    public String getCaseCode() { return caseCode; }
    public void setCaseCode(String v) { caseCode = v; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant v) { readAt = v; }
}
