package com.churchdesk.cases;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class CaseDtos {
    private CaseDtos() {}

    /** departmentId/returnOn are optional: the desk can send an issue to a department right at registration. */
    public record IssueIn(@NotNull IssueCategory category, @Size(max = 4000) String description, Long departmentId, LocalDate returnOn) {}

    /** One person in a case: who reports it, or who it is about. */
    public record PartyIn(@NotBlank @Size(max = 160) String fullName,
                          @NotNull Long churchId,
                          @Size(max = 40) String phone,
                          @NotNull WorkingStatus workingStatus,
                          @Size(max = 1000) String involvement) {}

    /** Add someone to a case that already exists. role is COMPLAINANT, SUBJECT or INVOLVED. */
    public record AddPartyRequest(@NotNull PartyRole role, @NotNull @Valid PartyIn person) {}

    public record CreateCaseRequest(@NotEmpty @Valid List<PartyIn> complainants,
                                    @Valid List<PartyIn> subjects,
                                    @NotEmpty @Valid List<IssueIn> issues,
                                    @Size(max = 8000) String discussionNotes,
                                    boolean letterIssued) {}

    public record ReferRequest(@NotNull Long departmentId, LocalDate returnOn, @Size(max = 2000) String note) {}
    public record NoteRequest(@Size(max = 4000) String note) {}
    public record LetterRequest(boolean issued) {}

    public record IssueDto(Long id, IssueCategory category, String description, IssueStatus status,
                           Long departmentId, String departmentName, Instant referredAt, LocalDate returnOn,
                           String resolutionNote, String resolvedBy, Instant resolvedAt,
                           Instant courtAt, String courtAckBy, Instant courtAckAt) {}

    public record EventDto(Long id, Long issueId, EventType type, String message, String actor, Instant createdAt) {}
    public record FileDto(Long id, Long issueId, String originalName, String contentType, long size, String uploadedBy, Instant uploadedAt) {}

    public record CaseSummary(Long id, String code, List<String> complainants, List<String> subjects, String churchName,
                              CaseStatus status, int issueCount, int resolvedCount, List<IssueCategory> categories,
                              boolean letterIssued, Instant createdAt) {}

    /** totalCases counts every case the person is in; complaintsAgainst counts cases where they are the one reported on. */
    public record PersonInfo(Long id, String fullName, String phone, Long churchId, String churchName,
                             WorkingStatus workingStatus, long totalCases, long openCases, long complaintsAgainst, String involvement) {}

    public record CaseDetail(Long id, String code, CaseStatus status, String discussionNotes, boolean letterIssued,
                             String createdBy, Instant createdAt, List<PersonInfo> complainants, List<PersonInfo> subjects, List<PersonInfo> involved,
                             List<IssueDto> issues, List<CaseSummary> relatedCases, List<EventDto> events, List<FileDto> files) {}

    public record PageDto<T>(List<T> items, long total, int page, int size) {}

    public record Summary(long total, long open, long referred, long court, long resolved) {}

    /** Someone expected back at the door. */
    public record QueueItem(Long caseId, String code, LocalDate returnOn, List<String> people, String churchName,
                            List<String> departments, int issues) {}

    /** One issue waiting in (or finished by) a department. */
    public record InboxItem(Long issueId, Long caseId, String code, IssueCategory category, String description, IssueStatus status,
                            String departmentName, Instant referredAt, LocalDate returnOn, List<String> complainants,
                            List<String> subjects, String churchName, Instant resolvedAt, String resolvedBy, String resolutionNote) {}

    public record InboxDto(List<InboxItem> items, long total, int page, int size, long pending) {}
}
