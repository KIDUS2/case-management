package com.churchdesk.dto.response;

import java.util.List;
import com.churchdesk.enums.WorkingStatus;

/** totalCases counts every case the person is in; complaintsAgainst counts cases where they are the one reported on. */
public record PersonInfo(Long id, String fullName, String phone, Long churchId, String churchName,
                         WorkingStatus workingStatus, long totalCases, long openCases, long complaintsAgainst, String involvement, String employeeId, String profession, String position,
                         List<String> extraPhones, boolean phoneExempt) {}
