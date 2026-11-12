package com.churchdesk.cases;

import jakarta.persistence.*;

@Entity
@Table(name = "case_party")
public class CaseParty {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "case_id", nullable = false) private ChurchCase churchCase;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "person_id", nullable = false) private Person person;
    @Enumerated(EnumType.STRING) @Column(name = "party_role", nullable = false) private PartyRole role;
    @Column(name = "sort_order", nullable = false) private int sortOrder;

    public Long getId() { return id; }
    public ChurchCase getChurchCase() { return churchCase; }
    public void setChurchCase(ChurchCase v) { churchCase = v; }
    public Person getPerson() { return person; }
    public void setPerson(Person v) { person = v; }
    public PartyRole getRole() { return role; }
    public void setRole(PartyRole v) { role = v; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int v) { sortOrder = v; }
}
