package com.churchdesk.church;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;

@Entity
@Table(name = "church")
@BatchSize(size = 50)
public class Church {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String name;
    @Column(name = "sub_city") private String subCity;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { name = v; }
    public String getSubCity() { return subCity; }
    public void setSubCity(String v) { subCity = v; }
}
