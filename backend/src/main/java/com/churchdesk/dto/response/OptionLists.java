package com.churchdesk.dto.response;

import java.util.List;

public record OptionLists(List<OptionDto> issueTypes, List<OptionDto> subCities, List<OptionDto> workingStatuses, List<OptionDto> titles) {}
