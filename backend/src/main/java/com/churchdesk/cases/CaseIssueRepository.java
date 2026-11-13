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

    /** What a department still has to do, in the order it must be served: urgent first, then first come first served. */
    @Query("select i from CaseIssue i where i.department.id = :did and i.status in :statuses order by case when i.priority = 'URGENT' then 0 else 1 end, i.referredAt asc, i.id asc")
    Page<CaseIssue> findQueueForDepartment(@Param("did") Long departmentId, @Param("statuses") Collection<IssueStatus> statuses, Pageable pageable);

    /** How many referred issues of the same department must be served before this one. */
    @Query("select count(i) from CaseIssue i where i.department.id = :did and i.status = :ref and i.id <> :id and "
            + "((:mine = 'NORMAL' and i.priority = 'URGENT') or (i.priority = :mine and (i.referredAt < :at or (i.referredAt = :at and i.id < :id))))")
    long countAhead(@Param("did") Long departmentId, @Param("ref") IssueStatus referred, @Param("id") Long id,
                    @Param("mine") String priority, @Param("at") java.time.Instant referredAt);

    @Query("select i from CaseIssue i join fetch i.churchCase c where i.status = :s and i.department is not null")
    List<CaseIssue> findAllInDepartments(@Param("s") IssueStatus status);

    long countByDepartmentIdAndStatus(Long departmentId, IssueStatus status);
}
