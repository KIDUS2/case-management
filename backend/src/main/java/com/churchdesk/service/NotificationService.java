package com.churchdesk.service;

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
import com.churchdesk.dto.response.NotificationDto;
import com.churchdesk.dto.response.NotificationPage;
import com.churchdesk.model.AppUser;
import com.churchdesk.model.Notification;
import com.churchdesk.repository.NotificationRepository;

@Service
public class NotificationService {

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

    /**
     * News that comes from a sub-city. It goes on its own channel and only to the people given (the administrator),
     * so it never gets lost among ordinary notifications.
     */
    @Transactional
    public void sendFromSubCity(Collection<AppUser> recipients, String type, String subCity, String title, String body, Long caseId, String caseCode, String exceptUsername) {
        Map<Long, AppUser> unique = new LinkedHashMap<>();
        for (AppUser u : recipients) {
            if (u == null || !u.isActive() || u.getUsername().equals(exceptUsername)) continue;
            unique.putIfAbsent(u.getId(), u);
        }
        repo.saveAll(unique.values().stream().map(u -> {
            Notification n = new Notification();
            n.setUserId(u.getId()); n.setType(type); n.setTitle(title); n.setBody(body); n.setCaseId(caseId); n.setCaseCode(caseCode);
            n.setChannel("SUBCITY"); n.setSubCity(subCity);
            return n;
        }).toList());
    }

    /** channel = GENERAL or SUBCITY to see one channel only; null for both. */
    @Transactional(readOnly = true)
    public NotificationPage page(Long userId, boolean unreadOnly, String channel, int page, int size) {
        var pr = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        var result = channel == null
                ? (unreadOnly ? repo.findByUserIdAndReadAtIsNull(userId, pr) : repo.findByUserId(userId, pr))
                : (unreadOnly ? repo.findByUserIdAndChannelAndReadAtIsNull(userId, channel, pr) : repo.findByUserIdAndChannel(userId, channel, pr));
        long unread = channel == null ? repo.countByUserIdAndReadAtIsNull(userId) : repo.countByUserIdAndChannelAndReadAtIsNull(userId, channel);
        return new NotificationPage(result.getContent().stream().map(this::dto).toList(), result.getTotalElements(),
                result.getNumber(), result.getSize(), unread);
    }

    @Transactional(readOnly = true)
    public long unread(Long userId, String channel) { return repo.countByUserIdAndChannelAndReadAtIsNull(userId, channel); }

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
    public void markAllRead(Long userId, String channel) {
        if (channel == null || channel.isBlank()) markAllRead(userId);
        else repo.markChannelRead(userId, channel, Instant.now());
    }

    private NotificationDto dto(Notification n) {
        return new NotificationDto(n.getId(), n.getType(), n.getTitle(), n.getBody(), n.getCaseId(), n.getCaseCode(), n.getCreatedAt(), n.getReadAt() != null, n.getChannel(), n.getSubCity());
    }
}
