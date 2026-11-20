package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.churchdesk.model.SubcityReferral;

public interface SubcityReferralRepository extends JpaRepository<SubcityReferral, Long> {
    List<SubcityReferral> findByCaseIdOrderByIdDesc(Long caseId);
    List<SubcityReferral> findBySubCityAndStatusOrderByIdDesc(String subCity, String status);
    boolean existsByCaseIdAndSubCity(Long caseId, String subCity);
}
