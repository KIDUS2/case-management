package com.churchdesk.cases;

import jakarta.persistence.*;

@Entity
@Table(name = "case_issue")
public class CaseIssue {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "case_id", nullable = false) private ChurchCase churchCase;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private IssueCategory category;
    @Column(columnDefinition = "text") private String description;
    @Column(name = "sort_order", nullable = false) private int sortOrder;

    public Long getId() { return id; }
    public ChurchCase getChurchCase() { return churchCase; }
    public void setChurchCase(ChurchCase v) { churchCase = v; }
    public IssueCategory getCategory() { return category; }
    public void setCategory(IssueCategory v) { category = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { description = v; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int v) { sortOrder = v; }
}
