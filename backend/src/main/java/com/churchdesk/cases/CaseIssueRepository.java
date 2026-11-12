package com.churchdesk.cases;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface CaseIssueRepository extends JpaRepository<CaseIssue, Long> {
    /** People expected back at the door on or before the given day (overdue ones included). */
    @Query("select i from CaseIssue i join fetch i.churchCase c where i.returnOn is not null and i.returnOn <= :until and i.status <> :resolved order by i.returnOn, c.id")
    List<CaseIssue> findExpected(@Param("until") LocalDate until, @Param("resolved") IssueStatus resolved);

    @Query("select i from CaseIssue i where i.department.id = :did and i.status in :statuses order by i.referredAt desc, i.id desc")
    Page<CaseIssue> findForDepartment(@Param("did") Long departmentId, @Param("statuses") Collection<IssueStatus> statuses, Pageable pageable);

    long countByDepartmentIdAndStatus(Long departmentId, IssueStatus status);
}
