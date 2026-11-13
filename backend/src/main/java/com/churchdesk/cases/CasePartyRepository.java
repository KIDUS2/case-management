package com.churchdesk.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;

public interface CasePartyRepository extends JpaRepository<CaseParty, Long> {
    @Query("select count(distinct cp.churchCase.id) from CaseParty cp where cp.person.id = :pid")
    long countCases(@Param("pid") Long pid);

    @Query("select count(distinct cp.churchCase.id) from CaseParty cp where cp.person.id = :pid and cp.churchCase.status in :statuses")
    long countCasesWithStatus(@Param("pid") Long pid, @Param("statuses") Collection<CaseStatus> statuses);

    @Query("select count(distinct cp.churchCase.id) from CaseParty cp where cp.person.id = :pid and cp.role = :role")
    long countCasesAs(@Param("pid") Long pid, @Param("role") PartyRole role);

    @Query("select cp from CaseParty cp join fetch cp.churchCase where cp.person.id = :pid order by cp.id desc")
    java.util.List<CaseParty> findByPersonIdOrderByIdDesc(@Param("pid") Long pid);
}
