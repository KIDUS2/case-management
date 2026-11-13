package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.churchdesk.model.ChurchFacility;

public interface ChurchFacilityRepository extends JpaRepository<ChurchFacility, Long> {
    List<ChurchFacility> findByChurchIdOrderByIdAsc(Long churchId);
}
