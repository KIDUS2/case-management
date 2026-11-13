package com.churchdesk.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateCaseRequest(@NotEmpty @Valid List<PartyIn> complainants,
                                @Valid List<PartyIn> subjects,
                                @NotEmpty @Valid List<IssueIn> issues,
                                @Size(max = 8000) String discussionNotes,
                                boolean letterIssued) {}
