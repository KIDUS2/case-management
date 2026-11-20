package com.churchdesk.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import com.churchdesk.model.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserId(Long userId, Pageable pageable);
    Page<Notification> findByUserIdAndReadAtIsNull(Long userId, Pageable pageable);
    long countByUserIdAndReadAtIsNull(Long userId);
    Page<Notification> findByUserIdAndChannel(Long userId, String channel, Pageable pageable);
    Page<Notification> findByUserIdAndChannelAndReadAtIsNull(Long userId, String channel, Pageable pageable);
    long countByUserIdAndChannelAndReadAtIsNull(Long userId, String channel);

    @Modifying(clearAutomatically = true)
    @Query("update Notification n set n.readAt = :now where n.userId = :uid and n.readAt is null")
    int markAllRead(@Param("uid") Long userId, @Param("now") Instant now);

    @Modifying(clearAutomatically = true)
    @Query("update Notification n set n.readAt = :now where n.userId = :uid and n.channel = :ch and n.readAt is null")
    int markChannelRead(@Param("uid") Long userId, @Param("ch") String channel, @Param("now") Instant now);
}
