package com.churchdesk.controller;

import com.churchdesk.service.AuditService;
import com.churchdesk.service.BackupService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.util.NoSuchElementException;

/** Backups: see them, make one now, download one. Only the administrator. */
@RestController
@RequestMapping("/api/backups")
@PreAuthorize("hasRole('ADMIN')")
public class BackupController {
    private final BackupService backups; private final AuditService audit;
    public BackupController(BackupService backups, AuditService audit) { this.backups = backups; this.audit = audit; }

    @GetMapping public BackupService.Status status() { return backups.status(); }

    @PostMapping("/run")
    public BackupService.Status run(Authentication auth) {
        try { backups.run(auth.getName()); }
        catch (IllegalStateException e) { throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, e.getMessage()); }
        return backups.status();
    }

    @GetMapping("/{name}")
    public ResponseEntity<Resource> download(@PathVariable String name, Authentication auth) {
        Path p;
        try { p = backups.file(name); }
        catch (IllegalArgumentException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage()); }
        catch (NoSuchElementException e) { throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage()); }
        audit.record(auth.getName(), "BACKUP_DOWNLOAD", "backup", name, "Backup downloaded");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(name).build().toString())
                .body(new FileSystemResource(p));
    }
}
