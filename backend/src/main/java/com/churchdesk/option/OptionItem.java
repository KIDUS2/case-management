package com.churchdesk.option;

import jakarta.persistence.*;

/** One entry of a dropdown list the administrator manages: issue types and kefle ketema (sub-cities). */
@Entity
@Table(name = "option_item")
public class OptionItem {
    public static final String ISSUE_TYPE = "ISSUE_TYPE", SUB_CITY = "SUB_CITY";

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "list_key", nullable = false) private String listKey;
    @Column(nullable = false) private String code;
    @Column(nullable = false) private String label;
    @Column(name = "label_am") private String labelAm;
    private String icon;
    @Column(nullable = false) private boolean system;
    @Column(nullable = false) private boolean active = true;
    @Column(name = "sort_no", nullable = false) private int sortNo;

    public Long getId() { return id; }
    public String getListKey() { return listKey; }
    public void setListKey(String v) { listKey = v; }
    public String getCode() { return code; }
    public void setCode(String v) { code = v; }
    public String getLabel() { return label; }
    public void setLabel(String v) { label = v; }
    public String getLabelAm() { return labelAm; }
    public void setLabelAm(String v) { labelAm = v; }
    public String getIcon() { return icon; }
    public void setIcon(String v) { icon = v; }
    public boolean isSystem() { return system; }
    public void setSystem(boolean v) { system = v; }
    public boolean isActive() { return active; }
    public void setActive(boolean v) { active = v; }
    public int getSortNo() { return sortNo; }
    public void setSortNo(int v) { sortNo = v; }
}
