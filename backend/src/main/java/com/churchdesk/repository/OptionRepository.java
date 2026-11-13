package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import com.churchdesk.model.OptionItem;

public interface OptionRepository extends JpaRepository<OptionItem, Long> {
    List<OptionItem> findByListKeyOrderBySortNoAscIdAsc(String listKey);
    Optional<OptionItem> findByListKeyAndCode(String listKey, String code);
    boolean existsByListKeyAndCodeIgnoreCase(String listKey, String code);
}
