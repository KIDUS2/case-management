package com.churchdesk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.churchdesk.model.ChurchFile;

public interface ChurchFileRepository extends JpaRepository<ChurchFile, Long> {
    List<ChurchFile> findByChurchIdOrderByUploadedAtDesc(Long churchId);
}
