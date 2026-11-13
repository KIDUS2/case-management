package com.churchdesk.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import com.churchdesk.enums.CaseStatus;
import com.churchdesk.model.ChurchCase;

public interface ChurchCaseRepository extends JpaRepository<ChurchCase, Long>, JpaSpecificationExecutor<ChurchCase> {
    boolean existsByCode(String code);
    Optional<ChurchCase> findByCode(String code);
    long countByStatus(CaseStatus status);

    /** Other cases that involve any of the given people. */
    @Query("select distinct c from ChurchCase c join c.parties cp where cp.person.id in :ids and c.id <> :caseId order by c.id desc")
    List<ChurchCase> findRelated(@Param("ids") Collection<Long> ids, @Param("caseId") Long caseId, Pageable pageable);
}
