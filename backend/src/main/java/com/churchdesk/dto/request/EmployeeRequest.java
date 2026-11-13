package com.churchdesk.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import com.churchdesk.enums.WorkingStatus;

public record EmployeeRequest(@Size(max = 40) String churchRef, @Size(max = 80) String firstName, @Size(max = 80) String middleName,
                              @Size(max = 80) String lastName, @Size(max = 160) String motherName, @NotNull Long churchId,
                              @Size(max = 40) String phone, @Size(max = 120) String email, @Size(max = 120) String profession,
                              @Size(max = 120) String position, @Size(max = 10) String gender, LocalDate birthDate, LocalDate hireDate,
                              @Size(max = 255) String address, @Size(max = 4000) String notes,
                              @Size(max = 120) String christianName, @Size(max = 160) String fatherConfessor, @Size(max = 40) String spiritualRank,
                              LocalDate ordainedOn, @NotNull WorkingStatus workingStatus, LocalDate idExpiresOn,
                              @Size(max = 5) List<@Size(max = 40) String> extraPhones, Boolean phoneExempt,
                              @jakarta.validation.constraints.DecimalMin("0") @jakarta.validation.constraints.Digits(integer = 10, fraction = 2) java.math.BigDecimal salary) {}
