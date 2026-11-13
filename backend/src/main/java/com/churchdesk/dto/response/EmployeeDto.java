package com.churchdesk.dto.response;

import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import com.churchdesk.enums.WorkingStatus;

public record EmployeeDto(Long id, String employeeId, String churchRef, String firstName, String middleName, String lastName, String fullName,
                          String motherName, Long churchId, String churchName, String phone, String email, String profession, String position,
                          String gender, LocalDate birthDate, LocalDate hireDate, String address, String notes,
                          String christianName, String fatherConfessor, String spiritualRank, LocalDate ordainedOn,
                          WorkingStatus workingStatus, boolean hasPhoto, LocalDate idIssuedOn, LocalDate idExpiresOn, boolean idExpired,
                          long totalCases, long openCases, long complaintsAgainst, long documents,
                          List<String> extraPhones, boolean phoneExempt, java.math.BigDecimal salary) {}
