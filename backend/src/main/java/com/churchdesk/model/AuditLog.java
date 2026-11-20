package com.churchdesk.model;

import jakarta.persistence.*;
import java.time.Instant;

/** One line of "who did what": logins, who opened a case, who downloaded a file. */
@Entity
@Table(name = "audit_log")
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Instant at = Instant.now();
    private String username;
    @Column(nullable = false) private String action;
    private String entity;
    @Column(name = "entity_id") private String entityId;
    private String detail;
    private String ip;

    protected AuditLog() {}
    public AuditLog(String username, String action, String entity, String entityId, String detail, String ip) {
        this.username = username; this.action = action; this.entity = entity; this.entityId = entityId; this.detail = detail; this.ip = ip;
    }
    public Long getId() { return id; }
    public Instant getAt() { return at; }
    public String getUsername() { return username; }
    public String getAction() { return action; }
    public String getEntity() { return entity; }
    public String getEntityId() { return entityId; }
    public String getDetail() { return detail; }
    public String getIp() { return ip; }
}
