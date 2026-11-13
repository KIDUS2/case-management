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
    @Column(name = "address") private String address;
    @Column(name = "phone") private String phone;
    @Column(name = "email") private String email;
    @Column(name = "patron_saint") private String patronSaint;
    @Column(name = "established_year") private Integer establishedYear;
    @Column(name = "land_area") private String landArea;
    @Column(name = "carta_number") private String cartaNumber;
    @Column(name = "latitude") private Double latitude;
    @Column(name = "longitude") private Double longitude;
    @Column(name = "notes", columnDefinition = "text") private String notes;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { name = v; }
    public String getSubCity() { return subCity; }
    public void setSubCity(String v) { subCity = v; }
    public String getAddress() { return address; }
    public void setAddress(String v) { address = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { phone = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { email = v; }
    public String getPatronSaint() { return patronSaint; }
    public void setPatronSaint(String v) { patronSaint = v; }
    public Integer getEstablishedYear() { return establishedYear; }
    public void setEstablishedYear(Integer v) { establishedYear = v; }
    public String getLandArea() { return landArea; }
    public void setLandArea(String v) { landArea = v; }
    public String getCartaNumber() { return cartaNumber; }
    public void setCartaNumber(String v) { cartaNumber = v; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double v) { latitude = v; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double v) { longitude = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { notes = v; }
}
