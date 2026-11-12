package com.churchdesk.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserId(Long userId, Pageable pageable);
    Page<Notification> findByUserIdAndReadAtIsNull(Long userId, Pageable pageable);
    long countByUserIdAndReadAtIsNull(Long userId);

    @Modifying(clearAutomatically = true)
    @Query("update Notification n set n.readAt = :now where n.userId = :uid and n.readAt is null")
    int markAllRead(@Param("uid") Long userId, @Param("now") Instant now);
}
