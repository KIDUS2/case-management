package com.churchdesk.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import java.util.Locale;
import com.churchdesk.dto.response.AuditDto;
import com.churchdesk.dto.common.PageDto;
import com.churchdesk.model.AuditLog;
import com.churchdesk.repository.AuditLogRepository;

/** Writes the "who did what" record. A problem here is logged but never stops the real work. */
@Service
public class AuditService {
    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository repo;

    public AuditService(AuditLogRepository repo) { this.repo = repo; }

    /** Saved on its own so a failed login (which rolls back) is still recorded. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String username, String action, String entity, String entityId, String detail) {
        try {
            String d = detail == null ? null : detail.length() > 480 ? detail.substring(0, 480) : detail;
            repo.save(new AuditLog(username, action, entity, entityId, d, ip()));
        } catch (Exception e) {
            log.warn("Could not write audit record {}: {}", action, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public PageDto<AuditDto> search(String q, int page, int size) {
        String like = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        var r = repo.search(like, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100)));
        return new PageDto<>(r.getContent().stream().map(a -> new AuditDto(a.getId(), a.getAt(), a.getUsername(), a.getAction(), a.getEntity(), a.getEntityId(), a.getDetail(), a.getIp())).toList(),
                r.getTotalElements(), r.getNumber(), r.getSize());
    }

    static String ip() {
        try {
            var attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            var req = attrs.getRequest();
            String fwd = req.getHeader("X-Forwarded-For");
            return fwd != null && !fwd.isBlank() ? fwd.split(",")[0].trim() : req.getRemoteAddr();
        } catch (Exception e) { return null; }
    }
}
