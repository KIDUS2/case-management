package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import com.churchdesk.enums.WorkingStatus;

/** One person in a case: who reports it, or who it is about. */
public record PartyIn(@NotBlank @Size(max = 160) String fullName,
                      @NotNull Long churchId,
                      @Size(max = 40) String phone,
                      @NotNull WorkingStatus workingStatus,
                      @Size(max = 1000) String involvement,
                      @Size(max = 40) String employeeId,
                      @Size(max = 5) List<@Size(max = 40) String> extraPhones,
                      Boolean phoneExempt) {}
