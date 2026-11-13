package com.churchdesk.model;

import jakarta.persistence.*;
import java.time.Instant;

/** A comment sent to a church, the church's findings, and the administrator's decision. */
@Entity
@Table(name = "church_inquiry")
public class ChurchInquiry {
    public static final String OPEN = "OPEN", ANSWERED = "ANSWERED", DECIDED = "DECIDED", DISPUTED = "DISPUTED";

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "case_id", nullable = false) private Long caseId;
    @Column(name = "issue_id") private Long issueId;
    @Column(name = "department_id") private Long departmentId;
    @Column(name = "church_id") private Long churchId;
    @Column(nullable = false) private String status = OPEN;
    @Column(nullable = false, columnDefinition = "text") private String question;
    @Column(name = "asked_by", nullable = false) private String askedBy;
    @Column(name = "asked_at", nullable = false) private Instant askedAt = Instant.now();
    @Column(columnDefinition = "text") private String finding;
    @Column(name = "finding_by") private String findingBy;
    @Column(name = "finding_at") private Instant findingAt;
    @Column(columnDefinition = "text") private String decision;
    @Column(name = "church_agreed") private Boolean churchAgreed;
    @Column(name = "decided_by") private String decidedBy;
    @Column(name = "decided_at") private Instant decidedAt;

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long v) { caseId = v; }
    public Long getIssueId() { return issueId; }
    public void setIssueId(Long v) { issueId = v; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long v) { departmentId = v; }
    public Long getChurchId() { return churchId; }
    public void setChurchId(Long v) { churchId = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public String getQuestion() { return question; }
    public void setQuestion(String v) { question = v; }
    public String getAskedBy() { return askedBy; }
    public void setAskedBy(String v) { askedBy = v; }
    public Instant getAskedAt() { return askedAt; }
    public String getFinding() { return finding; }
    public void setFinding(String v) { finding = v; }
    public String getFindingBy() { return findingBy; }
    public void setFindingBy(String v) { findingBy = v; }
    public Instant getFindingAt() { return findingAt; }
    public void setFindingAt(Instant v) { findingAt = v; }
    public String getDecision() { return decision; }
    public void setDecision(String v) { decision = v; }
    public Boolean getChurchAgreed() { return churchAgreed; }
    public void setChurchAgreed(Boolean v) { churchAgreed = v; }
    public String getDecidedBy() { return decidedBy; }
    public void setDecidedBy(String v) { decidedBy = v; }
    public Instant getDecidedAt() { return decidedAt; }
    public void setDecidedAt(Instant v) { decidedAt = v; }
}
