package com.churchdesk.church;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChurchRepository extends JpaRepository<Church, Long> {
    boolean existsByNameIgnoreCase(String name);
    List<Church> findAllByOrderByNameAsc();
}
