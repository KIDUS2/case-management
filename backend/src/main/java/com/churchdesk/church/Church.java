package com.churchdesk.church;

import jakarta.persistence.*;

@Entity
@Table(name = "church")
public class Church {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String name;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { name = v; }
}
