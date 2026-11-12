package com.churchdesk.notification;

import com.churchdesk.user.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;
    private final CurrentUser current;

    public NotificationController(NotificationService service, CurrentUser current) { this.service = service; this.current = current; }

    @GetMapping
    public NotificationService.NotificationPage list(@RequestParam(defaultValue = "false") boolean unread,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size, Authentication auth) {
        return service.page(current.get(auth).getId(), unread, page, size);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication auth) { return Map.of("count", service.unread(current.get(auth).getId())); }

    @PostMapping("/{id}/read") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@PathVariable Long id, Authentication auth) { service.markRead(current.get(auth).getId(), id); }

    @PostMapping("/read-all") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void readAll(Authentication auth) { service.markAllRead(current.get(auth).getId()); }
}
