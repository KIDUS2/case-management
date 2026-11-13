package com.churchdesk.church;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChurchRepository extends JpaRepository<Church, Long> {
    java.util.Optional<Church> findFirstByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    List<Church> findAllByOrderByNameAsc();
}
