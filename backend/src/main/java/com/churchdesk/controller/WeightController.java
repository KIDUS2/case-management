package com.churchdesk.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.churchdesk.service.OptionService;
import com.churchdesk.service.WeightService;

/** Default weight of each case type (how much time it takes). Everyone signed in may read it; only the administrator changes it. */
@RestController
@RequestMapping("/api/settings/weights")
public class WeightController {
    private final WeightService weights;
    private final OptionService options;

    public WeightController(WeightService weights, OptionService options) { this.weights = weights; this.options = options; }

    public record Row(String code, String label, int weight) {}

    @GetMapping
    public List<Row> list() {
        Map<String, String> labels = options.issueTypeLabels();
        List<Row> out = new ArrayList<>();
        for (var e : weights.all().entrySet()) out.add(new Row(e.getKey(), labels.getOrDefault(e.getKey(), e.getKey()), e.getValue()));
        return out;
    }

    @PutMapping @PreAuthorize("hasRole('ADMIN')")
    public List<Row> save(@RequestBody Map<String, Integer> body) {
        weights.save(new LinkedHashMap<>(body));
        return list();
    }
}
