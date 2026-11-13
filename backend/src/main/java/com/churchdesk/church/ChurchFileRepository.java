package com.churchdesk.church;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChurchFileRepository extends JpaRepository<ChurchFile, Long> {
    List<ChurchFile> findByChurchIdOrderByUploadedAtDesc(Long churchId);
}
