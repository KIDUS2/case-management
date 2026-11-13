package com.churchdesk.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import com.churchdesk.dto.request.OptionEdit;
import com.churchdesk.dto.response.OptionDto;
import com.churchdesk.dto.response.OptionLists;
import com.churchdesk.model.CaseIssue;
import com.churchdesk.model.Church;
import com.churchdesk.model.Department;
import com.churchdesk.model.OptionItem;
import com.churchdesk.repository.OptionRepository;

/** The dropdown lists in Settings. Everything that offers a choice reads it from here, so a new entry appears everywhere at once. */
@Service
public class OptionService {

    private final OptionRepository repo;
    @PersistenceContext private EntityManager em;

    public OptionService(OptionRepository repo) { this.repo = repo; }

    @Transactional(readOnly = true)
    public OptionLists lists() {
        return new OptionLists(dtos(OptionItem.ISSUE_TYPE), dtos(OptionItem.SUB_CITY));
    }

    private List<OptionDto> dtos(String key) {
        List<OptionDto> out = new ArrayList<>();
        for (OptionItem o : repo.findByListKeyOrderBySortNoAscIdAsc(key))
            out.add(new OptionDto(o.getId(), o.getCode(), o.getLabel(), o.getLabelAm(), o.getIcon(), o.isSystem(), o.isActive(), usage(o)));
        return out;
    }

    private long usage(OptionItem o) {
        if (OptionItem.ISSUE_TYPE.equals(o.getListKey()))
            return count("select count(i) from CaseIssue i where i.category = :c", o.getCode())
                    + count("select count(d) from Department d where d.handlesCategory = :c", o.getCode());
        return count("select count(c) from Church c where c.subCity = :c", o.getCode());
    }

    private long count(String jpql, String code) { return em.createQuery(jpql, Long.class).setParameter("c", code).getSingleResult(); }

    // ---- reading ----

    /** Codes of the issue types that can be chosen today, in list order. */
    @Transactional(readOnly = true)
    public List<String> activeIssueTypes() {
        return repo.findByListKeyOrderBySortNoAscIdAsc(OptionItem.ISSUE_TYPE).stream().filter(OptionItem::isActive).map(OptionItem::getCode).toList();
    }

    /** Every issue type code, active or not, so old cases are still counted. */
    @Transactional(readOnly = true)
    public Map<String, String> issueTypeLabels() {
        Map<String, String> m = new LinkedHashMap<>();
        for (OptionItem o : repo.findByListKeyOrderBySortNoAscIdAsc(OptionItem.ISSUE_TYPE)) m.put(o.getCode(), o.getLabel());
        return m;
    }

    @Transactional(readOnly = true)
    public String issueTypeLabel(String code) {
        return repo.findByListKeyAndCode(OptionItem.ISSUE_TYPE, code).map(OptionItem::getLabel).orElse(code);
    }

    /** Throws 400 unless the issue type exists and is switched on. */
    @Transactional(readOnly = true)
    public String requireIssueType(String code) {
        OptionItem o = code == null ? null : repo.findByListKeyAndCode(OptionItem.ISSUE_TYPE, code.trim()).orElse(null);
        if (o == null || !o.isActive()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That type of issue is not available. Choose one from the list.");
        return o.getCode();
    }

    /** The saved name of a sub-city (matching its name in English or Amharic), or null when blank. Throws 400 when it is not in the list. */
    @Transactional(readOnly = true)
    public String requireSubCity(String name) {
        if (name == null || name.isBlank()) return null;
        String found = matchSubCity(name);
        if (found == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "“" + name.trim() + "” is not in the sub-city list. Add it in Settings first.");
        return found;
    }

    /** Like requireSubCity but returns null instead of throwing. */
    @Transactional(readOnly = true)
    public String matchSubCity(String name) {
        if (name == null || name.isBlank()) return null;
        String q = name.trim().toLowerCase(Locale.ROOT);
        for (OptionItem o : repo.findByListKeyOrderBySortNoAscIdAsc(OptionItem.SUB_CITY))
            if (o.isActive() && (o.getCode().toLowerCase(Locale.ROOT).equals(q) || o.getLabel().toLowerCase(Locale.ROOT).equals(q)
                    || (o.getLabelAm() != null && o.getLabelAm().trim().equals(name.trim())))) return o.getCode();
        return null;
    }

    // ---- editing (administrator) ----

    @Transactional
    public OptionDto add(String listKey, OptionEdit e) {
        if (!OptionItem.ISSUE_TYPE.equals(listKey) && !OptionItem.SUB_CITY.equals(listKey))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown list");
        String label = clean(e.label());
        if (label == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter a name");
        OptionItem o = new OptionItem();
        o.setListKey(listKey);
        o.setLabel(label);
        o.setLabelAm(clean(e.labelAm()));
        o.setIcon(OptionItem.ISSUE_TYPE.equals(listKey) ? (clean(e.icon()) == null ? "🗂️" : clean(e.icon())) : null);
        o.setCode(OptionItem.SUB_CITY.equals(listKey) ? label : newTypeCode(label));
        if (repo.existsByListKeyAndCodeIgnoreCase(listKey, o.getCode()) || labelTaken(listKey, label, null))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "“" + label + "” is already in the list");
        o.setSortNo(repo.findByListKeyOrderBySortNoAscIdAsc(listKey).stream().mapToInt(OptionItem::getSortNo).max().orElse(0) + 1);
        o = repo.save(o);
        return new OptionDto(o.getId(), o.getCode(), o.getLabel(), o.getLabelAm(), o.getIcon(), o.isSystem(), o.isActive(), 0);
    }

    @Transactional
    public OptionDto edit(Long id, OptionEdit e) {
        OptionItem o = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        String label = clean(e.label());
        if (label != null && !label.equals(o.getLabel())) {
            if (labelTaken(o.getListKey(), label, o.getId())) throw new ResponseStatusException(HttpStatus.CONFLICT, "“" + label + "” is already in the list");
            if (OptionItem.SUB_CITY.equals(o.getListKey())) {
                // churches keep the name, so renaming moves them along
                em.createQuery("update Church c set c.subCity = :n where c.subCity = :o").setParameter("n", label).setParameter("o", o.getCode()).executeUpdate();
                o.setCode(label);
            }
            o.setLabel(label);
        }
        if (e.labelAm() != null) o.setLabelAm(clean(e.labelAm()));
        if (e.icon() != null && OptionItem.ISSUE_TYPE.equals(o.getListKey()) && clean(e.icon()) != null) o.setIcon(clean(e.icon()));
        if (e.active() != null) {
            if (!e.active() && o.isSystem()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This one is built in and cannot be switched off. You can rename it.");
            o.setActive(e.active());
        }
        return new OptionDto(o.getId(), o.getCode(), o.getLabel(), o.getLabelAm(), o.getIcon(), o.isSystem(), o.isActive(), usage(o));
    }

    @Transactional
    public void delete(Long id) {
        OptionItem o = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        if (o.isSystem()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This one is built in and cannot be deleted.");
        if (usage(o) > 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "It is already used. Switch it off instead, so it is hidden from new choices but old cases keep it.");
        repo.delete(o);
    }

    private boolean labelTaken(String listKey, String label, Long exceptId) {
        for (OptionItem o : repo.findByListKeyOrderBySortNoAscIdAsc(listKey))
            if (!o.getId().equals(exceptId) && o.getLabel().equalsIgnoreCase(label)) return true;
        return false;
    }

    private String newTypeCode(String label) {
        String base = label.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_").replaceAll("^_+|_+$", "");
        if (base.isEmpty()) base = "TYPE";
        if (base.length() > 24) base = base.substring(0, 24);
        String code = base;
        for (int n = 2; repo.existsByListKeyAndCodeIgnoreCase(OptionItem.ISSUE_TYPE, code); n++) code = base + "_" + n;
        return code;
    }

    private static String clean(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}
