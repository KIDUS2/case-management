package com.churchdesk.model;

import jakarta.persistence.*;
import java.time.Instant;

/** A committee (cooperation team) asked to look into a case. Its report goes to the app and the administrator. */
@Entity
@Table(name = "investigation")
public class Investigation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "case_id", nullable = false) private Long caseId;
    @Column(name = "issue_id") private Long issueId;
    @Column(nullable = false, columnDefinition = "text") private String instruction;
    private String team;
    @Column(name = "assigned_to") private String assignedTo;
    @Column(nullable = false) private String status = "OPEN";
    @Column(name = "requested_by", nullable = false) private String requestedBy;
    @Column(name = "requested_at", nullable = false) private Instant requestedAt = Instant.now();
    @Column(columnDefinition = "text") private String report;
    @Column(name = "reported_by") private String reportedBy;
    @Column(name = "reported_at") private Instant reportedAt;

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long v) { caseId = v; }
    public Long getIssueId() { return issueId; }
    public void setIssueId(Long v) { issueId = v; }
    public String getInstruction() { return instruction; }
    public void setInstruction(String v) { instruction = v; }
    public String getTeam() { return team; }
    public void setTeam(String v) { team = v; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String v) { assignedTo = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String v) { requestedBy = v; }
    public Instant getRequestedAt() { return requestedAt; }
    public String getReport() { return report; }
    public void setReport(String v) { report = v; }
    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String v) { reportedBy = v; }
    public Instant getReportedAt() { return reportedAt; }
    public void setReportedAt(Instant v) { reportedAt = v; }
}
