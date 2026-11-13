package com.churchdesk.model;

import jakarta.persistence.*;
import java.time.Instant;
import com.churchdesk.enums.EventType;

@Entity
@Table(name = "case_event")
public class CaseEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "case_id", nullable = false) private Long caseId;
    @Column(name = "issue_id") private Long issueId;
    @Enumerated(EnumType.STRING) @Column(name = "event_type", nullable = false) private EventType type;
    @Column(nullable = false, columnDefinition = "text") private String message;
    @Column(nullable = false) private String actor;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    public CaseEvent() {}
    public CaseEvent(Long caseId, Long issueId, EventType type, String message, String actor) {
        this.caseId = caseId; this.issueId = issueId; this.type = type; this.message = message; this.actor = actor;
    }
    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public Long getIssueId() { return issueId; }
    public EventType getType() { return type; }
    public String getMessage() { return message; }
    public String getActor() { return actor; }
    public Instant getCreatedAt() { return createdAt; }
}
