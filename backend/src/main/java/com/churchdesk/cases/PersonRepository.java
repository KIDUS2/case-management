package com.churchdesk.cases;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PersonRepository extends JpaRepository<Person, Long> {
    Optional<Person> findFirstByFullNameIgnoreCaseAndChurchId(String fullName, Long churchId);

    Optional<Person> findFirstByEmployeeIdIgnoreCase(String employeeId);

    @Query("select p from Person p join fetch p.church where (lower(p.fullName) like :pattern or lower(p.employeeId) like :pattern) order by p.fullName")
    List<Person> search(@Param("pattern") String pattern, Pageable pageable);

    @Query(value = "select p from Person p join fetch p.church c where (:cid is null or c.id = :cid) and (lower(p.fullName) like :q or lower(coalesce(p.employeeId,'')) like :q or lower(coalesce(p.phone,'')) like :q or lower(coalesce(p.profession,'')) like :q) and (:all = true or p.workingStatus <> com.churchdesk.cases.WorkingStatus.CHURCH_MEMBER)",
           countQuery = "select count(p) from Person p where (:cid is null or p.church.id = :cid) and (lower(p.fullName) like :q or lower(coalesce(p.employeeId,'')) like :q or lower(coalesce(p.phone,'')) like :q or lower(coalesce(p.profession,'')) like :q) and (:all = true or p.workingStatus <> com.churchdesk.cases.WorkingStatus.CHURCH_MEMBER)")
    org.springframework.data.domain.Page<Person> directory(@Param("q") String q, @Param("cid") Long churchId, @Param("all") boolean all, Pageable pageable);
}
