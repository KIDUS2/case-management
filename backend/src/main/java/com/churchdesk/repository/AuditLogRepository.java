package com.churchdesk.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.churchdesk.model.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("select a from AuditLog a where :q = '' or lower(coalesce(a.username,'')) like concat('%', :q, '%') "
            + "or lower(a.action) like concat('%', :q, '%') or lower(coalesce(a.entityId,'')) like concat('%', :q, '%') "
            + "or lower(coalesce(a.detail,'')) like concat('%', :q, '%') order by a.at desc, a.id desc")
    Page<AuditLog> search(@Param("q") String q, Pageable pageable);
}
