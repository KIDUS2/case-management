package com.churchdesk.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateCaseRequest(@NotEmpty @Valid List<PartyIn> complainants,
                                @Valid List<PartyIn> subjects,
                                @NotEmpty @Valid List<IssueIn> issues,
                                @Size(max = 8000) String discussionNotes,
                                boolean letterIssued,
                                /** ISSUE (default) or CHARITY. */
                                @Size(max = 10) String kind,
                                /** A sub-city that already solved the case writes what it did here; the diocese is shown it. */
                                @Size(max = 4000) String localSolution,
                                /** For a large group: how many people were expected, so the desk can see who is still missing. */
                                @jakarta.validation.constraints.Min(2) @jakarta.validation.constraints.Max(1000) Integer expectedPeople) {}
