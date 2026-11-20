package com.churchdesk.dto.request;

import jakarta.validation.constraints.Size;

/** Either one is enough: the case number from the SMS, or the phone number the person registered with. */
public record CaseLookupRequest(@Size(max = 12) String code, @Size(max = 30) String phone) {}
