package com.churchdesk.cases;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "church_case")
public class ChurchCase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "case_no", unique = true) private String caseNo;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "person_id", nullable = false) private Person person;
    @Enumerated(EnumType.STRING) @Column(name = "role_in_case", nullable = false) private CaseRole roleInCase;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private CaseStatus status = CaseStatus.OPEN;
    @Column(name = "discussion_notes", columnDefinition = "text") private String discussionNotes;
    @Column(name = "letter_issued", nullable = false) private boolean letterIssued;
    @Column(name = "created_by", nullable = false) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "churchCase", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 50)
    private List<CaseIssue> issues = new ArrayList<>();

    public Long getId() { return id; }
    public String getCaseNo() { return caseNo; }
    public void setCaseNo(String v) { caseNo = v; }
    public Person getPerson() { return person; }
    public void setPerson(Person v) { person = v; }
    public CaseRole getRoleInCase() { return roleInCase; }
    public void setRoleInCase(CaseRole v) { roleInCase = v; }
    public CaseStatus getStatus() { return status; }
    public void setStatus(CaseStatus v) { status = v; }
    public String getDiscussionNotes() { return discussionNotes; }
    public void setDiscussionNotes(String v) { discussionNotes = v; }
    public boolean isLetterIssued() { return letterIssued; }
    public void setLetterIssued(boolean v) { letterIssued = v; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String v) { createdBy = v; }
    public Instant getCreatedAt() { return createdAt; }
    public List<CaseIssue> getIssues() { return issues; }
}
