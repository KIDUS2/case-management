package com.churchdesk.cases;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ChurchCaseRepository extends JpaRepository<ChurchCase, Long>, JpaSpecificationExecutor<ChurchCase> {

    @Override
    @EntityGraph(attributePaths = {"person", "person.church"})
    Page<ChurchCase> findAll(Specification<ChurchCase> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"person", "person.church", "issues"})
    Optional<ChurchCase> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"person", "person.church"})
    List<ChurchCase> findByPersonIdOrderByIdDesc(Long personId);

    long countByStatus(CaseStatus status);
    long countByPersonId(Long personId);
    long countByPersonIdAndStatusIn(Long personId, Collection<CaseStatus> statuses);
}
