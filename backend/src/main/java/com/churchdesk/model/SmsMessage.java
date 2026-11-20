package com.churchdesk.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sms_message")
public class SmsMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "case_id") private Long caseId;
    @Column(nullable = false) private String phone;
    @Column(nullable = false, length = 1000) private String body;
    @Column(nullable = false) private String status;
    private String error;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected SmsMessage() {}
    public SmsMessage(Long caseId, String phone, String body, String status, String error) {
        this.caseId = caseId; this.phone = phone; this.body = body; this.status = status; this.error = error;
    }
    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public String getPhone() { return phone; }
    public String getBody() { return body; }
    public String getStatus() { return status; }
    public String getError() { return error; }
    public Instant getCreatedAt() { return createdAt; }
}
