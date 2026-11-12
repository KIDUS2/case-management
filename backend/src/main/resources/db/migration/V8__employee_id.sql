-- The ID the church gave the employee. Optional, but unique when present.
ALTER TABLE person ADD COLUMN employee_id VARCHAR(40);
CREATE UNIQUE INDEX ux_person_employee_id ON person (lower(employee_id)) WHERE employee_id IS NOT NULL;
