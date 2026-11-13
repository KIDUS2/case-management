package com.churchdesk.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.List;
import com.churchdesk.enums.WorkingStatus;
import com.churchdesk.model.Person;
import com.churchdesk.repository.PersonRepository;
import com.churchdesk.util.EmployeeIds;

/** On start, anyone who is an employee but has no ID yet gets one. Safe to run again. */
@Component
public class EmployeeIdBackfill implements ApplicationRunner {
    private final PersonRepository persons;
    private final TransactionTemplate tx;

    public EmployeeIdBackfill(PersonRepository persons, TransactionTemplate tx) { this.persons = persons; this.tx = tx; }

    @Override
    public void run(ApplicationArguments args) {
        tx.executeWithoutResult(s -> {
            List<Person> missing = persons.findByEmployeeIdIsNullAndWorkingStatusNot(WorkingStatus.CHURCH_MEMBER);
            for (Person p : missing) p.assignId(EmployeeIds.generate(id -> persons.existsByEmployeeId(id)));
            persons.saveAll(missing);
            List<Person> unsplit = persons.findByFirstNameIsNull();
            unsplit.forEach(Person::splitFullName);
            persons.saveAll(unsplit);
        });
    }
}
