package com.churchdesk.church;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChurchFacilityRepository extends JpaRepository<ChurchFacility, Long> {
    List<ChurchFacility> findByChurchIdOrderByIdAsc(Long churchId);
}
