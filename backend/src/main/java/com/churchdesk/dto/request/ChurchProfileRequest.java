package com.churchdesk.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

public record ChurchProfileRequest(@Size(max = 255) String address, @Size(max = 40) String phone, @Size(max = 120) String email, @Size(max = 120) String patronSaint,
                             @Min(300) @Max(2100) Integer establishedYear, @Size(max = 60) String landArea, @Size(max = 80) String cartaNumber,
                             @DecimalMin("-90") @DecimalMax("90") Double latitude, @DecimalMin("-180") @DecimalMax("180") Double longitude,
                             @Size(max = 4000) String notes) {}
