package com.churchdesk.controller;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.math.BigDecimal;
import java.util.*;
import com.churchdesk.dto.response.ChurchRow;
import com.churchdesk.dto.response.PositionRow;
import com.churchdesk.dto.response.WorkforceLeader;
import com.churchdesk.dto.response.WorkforceOverview;
import com.churchdesk.dto.response.WorkforceSubCityRow;
import com.churchdesk.dto.response.WorkforceTotals;
import com.churchdesk.enums.WorkingStatus;
import com.churchdesk.model.Church;
import com.churchdesk.model.Person;

/** Who works where, in what position, and what each church and sub-city pays. Salaries are the administrator's alone. */
@RestController
@RequestMapping("/api/workforce")
@PreAuthorize("hasRole('ADMIN')")
public class WorkforceController {
    /** People on the payroll side of the church: not church members, retired people or volunteers. */
    private static final List<WorkingStatus> STAFF = List.of(WorkingStatus.ACTIVE_EMPLOYEE, WorkingStatus.LEADER_PRIEST, WorkingStatus.CONTRACT, WorkingStatus.SUSPENDED);

    @PersistenceContext private EntityManager em;

    @GetMapping @Transactional(readOnly = true)
    public WorkforceOverview overview() {
        Map<Long, Object[]> churches = new LinkedHashMap<>();
        for (Object[] r : em.createQuery("select c.id, c.name, c.subCity from Church c order by c.name", Object[].class).getResultList()) churches.put((Long) r[0], r);
        List<Person> staff = em.createQuery("select p from Person p join fetch p.church where p.workingStatus in :s order by p.fullName", Person.class)
                .setParameter("s", STAFF).getResultList();

        Map<Long, List<Person>> byChurch = new HashMap<>();
        for (Person p : staff) byChurch.computeIfAbsent(p.getChurch().getId(), k -> new ArrayList<>()).add(p);

        List<ChurchRow> rows = new ArrayList<>();
        Map<String, long[]> sub = new TreeMap<>();      // churches, employees, leaders
        Map<String, BigDecimal> subPay = new HashMap<>();
        long employees = 0, leaders = 0, noSalary = 0;
        BigDecimal payroll = BigDecimal.ZERO;
        for (Object[] c : churches.values()) {
            List<Person> list = byChurch.getOrDefault((Long) c[0], List.of());
            Map<String, long[]> pos = new TreeMap<>();
            Map<String, BigDecimal> posPay = new HashMap<>();
            List<WorkforceLeader> lead = new ArrayList<>();
            BigDecimal pay = BigDecimal.ZERO;
            long no = 0;
            for (Person p : list) {
                String position = p.getPosition() == null || p.getPosition().isBlank() ? "—" : p.getPosition();
                pos.computeIfAbsent(position, k -> new long[1])[0]++;
                BigDecimal s = p.getSalary() == null ? BigDecimal.ZERO : p.getSalary();
                if (p.getSalary() == null) no++;
                posPay.merge(position, s, BigDecimal::add);
                pay = pay.add(s);
                if (p.getWorkingStatus() == WorkingStatus.LEADER_PRIEST) lead.add(new WorkforceLeader(p.getId(), p.getFullName(), p.getPosition(), p.getPhone()));
            }
            List<PositionRow> positions = pos.entrySet().stream().map(e -> new PositionRow(e.getKey(), e.getValue()[0], posPay.get(e.getKey())))
                    .sorted((a, b) -> Long.compare(b.employees(), a.employees())).toList();
            String subName = c[2] == null || ((String) c[2]).isBlank() ? "—" : (String) c[2];
            rows.add(new ChurchRow((Long) c[0], (String) c[1], subName, list.size(), lead.size(), no, pay, positions, lead));
            long[] t = sub.computeIfAbsent(subName, k -> new long[3]);
            t[0]++; t[1] += list.size(); t[2] += lead.size();
            subPay.merge(subName, pay, BigDecimal::add);
            employees += list.size(); leaders += lead.size(); noSalary += no; payroll = payroll.add(pay);
        }
        List<WorkforceSubCityRow> subs = sub.entrySet().stream().map(e -> new WorkforceSubCityRow(e.getKey(), e.getValue()[0], e.getValue()[1], e.getValue()[2], subPay.get(e.getKey())))
                .sorted((a, b) -> Long.compare(b.employees(), a.employees())).toList();
        return new WorkforceOverview(new WorkforceTotals(rows.size(), employees, leaders, noSalary, payroll), subs, rows);
    }
}
