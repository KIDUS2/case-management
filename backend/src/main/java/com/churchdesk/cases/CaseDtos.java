package com.churchdesk.cases;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class CaseDtos {
    private CaseDtos() {}

    public record IssueIn(@NotNull IssueCategory category, @Size(max = 4000) String description) {}

    /** One person in a case: who reports it, or who it is about. */
    public record PartyIn(@NotBlank @Size(max = 160) String fullName,
                          @NotNull Long churchId,
                          @Size(max = 40) String phone,
                          @NotNull WorkingStatus workingStatus) {}

    public record CreateCaseRequest(@NotEmpty @Valid List<PartyIn> complainants,
                                    @Valid List<PartyIn> subjects,
                                    @NotEmpty @Valid List<IssueIn> issues,
                                    @Size(max = 8000) String discussionNotes,
                                    boolean letterIssued) {}

    public record IssueDto(Long id, IssueCategory category, String description) {}

    public record CaseSummary(Long id, String code, List<String> complainants, List<String> subjects, String churchName,
                              CaseStatus status, int issueCount, List<IssueCategory> categories,
                              boolean letterIssued, Instant createdAt) {}

    /** totalCases counts every case the person is in; complaintsAgainst counts cases where they are the one reported on. */
    public record PersonInfo(Long id, String fullName, String phone, Long churchId, String churchName,
                             WorkingStatus workingStatus, long totalCases, long openCases, long complaintsAgainst) {}

    public record CaseDetail(Long id, String code, CaseStatus status, String discussionNotes, boolean letterIssued,
                             String createdBy, Instant createdAt, List<PersonInfo> complainants, List<PersonInfo> subjects,
                             List<IssueDto> issues, List<CaseSummary> relatedCases) {}

    public record PageDto<T>(List<T> items, long total, int page, int size) {}

    public record Summary(long total, long open, long referred, long court, long resolved) {}
}
