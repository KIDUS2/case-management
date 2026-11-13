package com.churchdesk.model;

import jakarta.persistence.*;
import java.time.Instant;

/** Two cases the staff say belong together. One row covers both directions. */
@Entity
@Table(name = "case_link")
public class CaseLink {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "case_id", nullable = false) private Long caseId;
    @Column(name = "linked_case_id", nullable = false) private Long linkedCaseId;
    @Column(name = "linked_by", nullable = false) private String linkedBy;
    @Column(name = "linked_at", nullable = false) private Instant linkedAt = Instant.now();

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long v) { caseId = v; }
    public Long getLinkedCaseId() { return linkedCaseId; }
    public void setLinkedCaseId(Long v) { linkedCaseId = v; }
    public String getLinkedBy() { return linkedBy; }
    public void setLinkedBy(String v) { linkedBy = v; }
    public Instant getLinkedAt() { return linkedAt; }
}
