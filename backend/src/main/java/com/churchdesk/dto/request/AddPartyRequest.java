package com.churchdesk.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import com.churchdesk.enums.PartyRole;

/** Add someone to a case that already exists. role is COMPLAINANT, SUBJECT or INVOLVED. */
public record AddPartyRequest(@NotNull PartyRole role, @NotNull @Valid PartyIn person) {}
