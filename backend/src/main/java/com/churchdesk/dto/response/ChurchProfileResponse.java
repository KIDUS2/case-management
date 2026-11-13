package com.churchdesk.dto.response;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

public record ChurchProfileResponse(Long id, String name, String subCity, String address, String phone, String email, String patronSaint, Integer establishedYear,
                            String landArea, String cartaNumber, Double latitude, Double longitude, String notes, boolean hasCarta) {}
