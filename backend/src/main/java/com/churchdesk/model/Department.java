package com.churchdesk.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "department")
public class Department {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String name;
    /** The kind of issue this department normally handles (used to suggest it when referring). */
    @Column(name = "handles_category") private String handlesCategory;
    @Column(nullable = false) private boolean active = true;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { name = v; }
    public String getHandlesCategory() { return handlesCategory; }
    public void setHandlesCategory(String v) { handlesCategory = v; }
    public boolean isActive() { return active; }
    public void setActive(boolean v) { active = v; }
}
