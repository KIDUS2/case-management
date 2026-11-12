package com.churchdesk.cases;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PersonRepository extends JpaRepository<Person, Long> {
    Optional<Person> findFirstByFullNameIgnoreCaseAndChurchId(String fullName, Long churchId);

    @Query("select p from Person p join fetch p.church where lower(p.fullName) like :pattern order by p.fullName")
    List<Person> search(@Param("pattern") String pattern, Pageable pageable);
}
