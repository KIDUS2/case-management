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

    public record CreateCaseRequest(@NotBlank @Size(max = 160) String fullName,
                                    @NotNull Long churchId,
                                    @Size(max = 40) String phone,
                                    @NotNull WorkingStatus workingStatus,
                                    @NotNull CaseRole roleInCase,
                                    @NotEmpty @Valid List<IssueIn> issues,
                                    @Size(max = 8000) String discussionNotes,
                                    boolean letterIssued) {}

    public record IssueDto(Long id, IssueCategory category, String description) {}

    public record CaseSummary(Long id, String caseNo, String personName, String churchName, CaseStatus status,
                              int issueCount, List<IssueCategory> categories, boolean letterIssued, Instant createdAt) {}

    public record PersonInfo(Long id, String fullName, String phone, Long churchId, String churchName,
                             WorkingStatus workingStatus, long totalCases, long openCases) {}

    public record CaseDetail(Long id, String caseNo, CaseStatus status, CaseRole roleInCase, String discussionNotes,
                             boolean letterIssued, String createdBy, Instant createdAt, PersonInfo person,
                             List<IssueDto> issues, List<CaseSummary> otherCases) {}

    public record PageDto<T>(List<T> items, long total, int page, int size) {}

    public record Summary(long total, long open, long referred, long court, long resolved) {}
}
