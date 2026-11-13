package com.churchdesk.cases;

import com.churchdesk.department.Department;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "case_issue")
public class CaseIssue {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "case_id", nullable = false) private ChurchCase churchCase;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private IssueCategory category;
    @Column(columnDefinition = "text") private String description;
    @Column(name = "sort_order", nullable = false) private int sortOrder;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private IssueStatus status = IssueStatus.NEW;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "department_id") private Department department;
    @Column(name = "referred_at") private Instant referredAt;
    /** The day the person has been asked to come back to the door. */
    @Column(name = "return_on") private LocalDate returnOn;
    @Column(name = "resolution_note", columnDefinition = "text") private String resolutionNote;
    @Column(name = "resolved_by") private String resolvedBy;
    @Column(name = "resolved_at") private Instant resolvedAt;
    @Column(nullable = false) private String priority = "NORMAL";
    @Column(name = "urgent_by") private String urgentBy;
    @Column(name = "urgent_at") private Instant urgentAt;
    @Column(name = "escalation_level", nullable = false) private int escalationLevel;
    @Column(name = "escalated_at") private Instant escalatedAt;
    @Column(name = "court_at") private Instant courtAt;
    @Column(name = "court_ack_by") private String courtAckBy;
    @Column(name = "court_ack_at") private Instant courtAckAt;

    public Long getId() { return id; }
    public ChurchCase getChurchCase() { return churchCase; }
    public void setChurchCase(ChurchCase v) { churchCase = v; }
    public IssueCategory getCategory() { return category; }
    public void setCategory(IssueCategory v) { category = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { description = v; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int v) { sortOrder = v; }
    public IssueStatus getStatus() { return status; }
    public void setStatus(IssueStatus v) { status = v; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department v) { department = v; }
    public Instant getReferredAt() { return referredAt; }
    public void setReferredAt(Instant v) { referredAt = v; }
    public LocalDate getReturnOn() { return returnOn; }
    public void setReturnOn(LocalDate v) { returnOn = v; }
    public String getResolutionNote() { return resolutionNote; }
    public void setResolutionNote(String v) { resolutionNote = v; }
    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String v) { resolvedBy = v; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant v) { resolvedAt = v; }
    public String getPriority() { return priority; }
    public void setPriority(String v) { priority = v; }
    public boolean isUrgent() { return "URGENT".equals(priority); }
    public String getUrgentBy() { return urgentBy; }
    public void setUrgentBy(String v) { urgentBy = v; }
    public Instant getUrgentAt() { return urgentAt; }
    public void setUrgentAt(Instant v) { urgentAt = v; }
    public int getEscalationLevel() { return escalationLevel; }
    public void setEscalationLevel(int v) { escalationLevel = v; }
    public Instant getEscalatedAt() { return escalatedAt; }
    public void setEscalatedAt(Instant v) { escalatedAt = v; }
    public Instant getCourtAt() { return courtAt; }
    public void setCourtAt(Instant v) { courtAt = v; }
    public String getCourtAckBy() { return courtAckBy; }
    public void setCourtAckBy(String v) { courtAckBy = v; }
    public Instant getCourtAckAt() { return courtAckAt; }
    public void setCourtAckAt(Instant v) { courtAckAt = v; }
}
