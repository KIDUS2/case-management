package com.churchdesk.cases;

import jakarta.persistence.*;
import java.time.Instant;

/** The admin lets one user open one case. */
@Entity
@Table(name = "case_grant")
public class CaseGrant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "case_id", nullable = false) private Long caseId;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(name = "granted_by", nullable = false) private String grantedBy;
    @Column(name = "granted_at", nullable = false) private Instant grantedAt = Instant.now();

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long v) { caseId = v; }
    public Long getUserId() { return userId; }
    public void setUserId(Long v) { userId = v; }
    public String getGrantedBy() { return grantedBy; }
    public void setGrantedBy(String v) { grantedBy = v; }
    public Instant getGrantedAt() { return grantedAt; }
}
