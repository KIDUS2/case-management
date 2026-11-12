package com.churchdesk.notification;

import com.churchdesk.user.AppUser;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {
    public record NotificationDto(Long id, String type, String title, String body, Long caseId, String caseCode, Instant createdAt, boolean read) {}
    public record NotificationPage(List<NotificationDto> items, long total, int page, int size, long unread) {}

    private final NotificationRepository repo;
    public NotificationService(NotificationRepository repo) { this.repo = repo; }

    /** One notification per person, even if they are listed more than once (for example admin and case creator). */
    @Transactional
    public void send(Collection<AppUser> recipients, String type, String title, String body, Long caseId, String caseCode, String exceptUsername) {
        Map<Long, AppUser> unique = new LinkedHashMap<>();
        for (AppUser u : recipients) {
            if (u == null || !u.isActive() || u.getUsername().equals(exceptUsername)) continue;
            unique.putIfAbsent(u.getId(), u);
        }
        List<Notification> batch = unique.values().stream().map(u -> {
            Notification n = new Notification();
            n.setUserId(u.getId()); n.setType(type); n.setTitle(title); n.setBody(body); n.setCaseId(caseId); n.setCaseCode(caseCode);
            return n;
        }).toList();
        repo.saveAll(batch);
    }

    @Transactional(readOnly = true)
    public NotificationPage page(Long userId, boolean unreadOnly, int page, int size) {
        var pr = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        var result = unreadOnly ? repo.findByUserIdAndReadAtIsNull(userId, pr) : repo.findByUserId(userId, pr);
        return new NotificationPage(result.getContent().stream().map(this::dto).toList(), result.getTotalElements(),
                result.getNumber(), result.getSize(), repo.countByUserIdAndReadAtIsNull(userId));
    }

    @Transactional(readOnly = true)
    public long unread(Long userId) { return repo.countByUserIdAndReadAtIsNull(userId); }

    @Transactional
    public void markRead(Long userId, Long id) {
        Notification n = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!n.getUserId().equals(userId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        if (n.getReadAt() == null) n.setReadAt(Instant.now());
    }

    @Transactional
    public void markAllRead(Long userId) { repo.markAllRead(userId, Instant.now()); }

    private NotificationDto dto(Notification n) {
        return new NotificationDto(n.getId(), n.getType(), n.getTitle(), n.getBody(), n.getCaseId(), n.getCaseCode(), n.getCreatedAt(), n.getReadAt() != null);
    }
}
