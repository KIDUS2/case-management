package com.churchdesk.model;

import jakarta.persistence.*;
import java.time.Instant;

/** The diocese sends a case to a sub-city; the sub-city sends its solution back. */
@Entity
@Table(name = "subcity_referral")
public class SubcityReferral {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "case_id", nullable = false) private Long caseId;
    @Column(name = "issue_id") private Long issueId;
    @Column(name = "sub_city", nullable = false) private String subCity;
    @Column(nullable = false, columnDefinition = "text") private String instruction;
    @Column(nullable = false) private String status = "SENT";
    @Column(name = "sent_by", nullable = false) private String sentBy;
    @Column(name = "sent_at", nullable = false) private Instant sentAt = Instant.now();
    @Column(columnDefinition = "text") private String solution;
    @Column(name = "replied_by") private String repliedBy;
    @Column(name = "replied_at") private Instant repliedAt;

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long v) { caseId = v; }
    public Long getIssueId() { return issueId; }
    public void setIssueId(Long v) { issueId = v; }
    public String getSubCity() { return subCity; }
    public void setSubCity(String v) { subCity = v; }
    public String getInstruction() { return instruction; }
    public void setInstruction(String v) { instruction = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public String getSentBy() { return sentBy; }
    public void setSentBy(String v) { sentBy = v; }
    public Instant getSentAt() { return sentAt; }
    public String getSolution() { return solution; }
    public void setSolution(String v) { solution = v; }
    public String getRepliedBy() { return repliedBy; }
    public void setRepliedBy(String v) { repliedBy = v; }
    public Instant getRepliedAt() { return repliedAt; }
    public void setRepliedAt(Instant v) { repliedAt = v; }
}
