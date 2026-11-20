package com.churchdesk.model;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import com.churchdesk.enums.CaseStatus;
import com.churchdesk.enums.ReviewStatus;

@Entity
@Table(name = "church_case")
public class ChurchCase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    /** Short code (for example K7M2QX) that staff type to open the case. */
    @Column(nullable = false, unique = true, length = 8) private String code;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private CaseStatus status = CaseStatus.OPEN;
    @Column(name = "discussion_notes", columnDefinition = "text") private String discussionNotes;
    @Column(name = "letter_issued", nullable = false) private boolean letterIssued;
    @Enumerated(EnumType.STRING) @Column(name = "review_status", nullable = false) private ReviewStatus reviewStatus = ReviewStatus.ACCEPTED;
    @Column(name = "review_note") private String reviewNote;
    @Column(name = "reviewed_by") private String reviewedBy;
    @Column(name = "reviewed_at") private Instant reviewedAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private com.churchdesk.enums.CaseKind kind = com.churchdesk.enums.CaseKind.ISSUE;
    @Column(name = "sub_city_solved", nullable = false) private boolean subCitySolved;
    @Column(name = "created_by", nullable = false) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "churchCase", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 50)
    private List<CaseParty> parties = new ArrayList<>();

    @OneToMany(mappedBy = "churchCase", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 50)
    private List<CaseIssue> issues = new ArrayList<>();

    public Long getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String v) { code = v; }
    public CaseStatus getStatus() { return status; }
    public void setStatus(CaseStatus v) { status = v; }
    public String getDiscussionNotes() { return discussionNotes; }
    public void setDiscussionNotes(String v) { discussionNotes = v; }
    public boolean isLetterIssued() { return letterIssued; }
    public void setLetterIssued(boolean v) { letterIssued = v; }
    @Column(name = "expected_people") private Integer expectedPeople;
    public Integer getExpectedPeople() { return expectedPeople; }
    public void setExpectedPeople(Integer v) { expectedPeople = v; }
    public com.churchdesk.enums.CaseKind getKind() { return kind; }
    public void setKind(com.churchdesk.enums.CaseKind v) { kind = v; }
    public boolean isSubCitySolved() { return subCitySolved; }
    public void setSubCitySolved(boolean v) { subCitySolved = v; }
    public ReviewStatus getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(ReviewStatus v) { reviewStatus = v; }
    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String v) { reviewNote = v; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String v) { reviewedBy = v; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant v) { reviewedAt = v; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String v) { createdBy = v; }
    public Instant getCreatedAt() { return createdAt; }
    public List<CaseParty> getParties() { return parties; }
    public List<CaseIssue> getIssues() { return issues; }
}
