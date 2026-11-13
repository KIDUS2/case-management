package com.churchdesk.dto.response;

public record OptionDto(Long id, String code, String label, String labelAm, String icon, boolean system, boolean active, long inUse) {}
