-- Education (spiritual and secular) and service history kept on the employee.
CREATE TABLE employee_education (
    id          BIGSERIAL PRIMARY KEY,
    person_id   BIGINT       NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    kind        VARCHAR(12)  NOT NULL,          -- SPIRITUAL or SECULAR
    level       VARCHAR(120),                   -- Diploma, BA, Zema, Qene ...
    field       VARCHAR(160),                   -- subject or specialisation
    institution VARCHAR(200),
    start_year  INT,
    end_year    INT,
    completed   BOOLEAN      NOT NULL DEFAULT TRUE,
    notes       VARCHAR(1000)
);
CREATE INDEX ix_employee_education_person ON employee_education(person_id);

CREATE TABLE employee_posting (
    id          BIGSERIAL PRIMARY KEY,
    person_id   BIGINT       NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    place       VARCHAR(200) NOT NULL,          -- church or office
    position    VARCHAR(160),
    start_date  DATE,
    end_date    DATE,                           -- empty = still serving here
    notes       VARCHAR(1000)
);
CREATE INDEX ix_employee_posting_person ON employee_posting(person_id);

-- everyone already registered starts with their current church as the open posting
INSERT INTO employee_posting (person_id, place, position, start_date)
SELECT p.id, c.name, p.position, COALESCE(p.hire_date, p.created_at::date)
  FROM person p JOIN church c ON c.id = p.church_id
 WHERE p.working_status <> 'CHURCH_MEMBER';
