-- employee_id is now the number the system creates (12 digits, like a national ID).
-- Whatever number the church already used is kept as church_ref so nothing is lost.
ALTER TABLE person ADD COLUMN church_ref VARCHAR(40);
UPDATE person SET church_ref = employee_id, employee_id = NULL WHERE employee_id IS NOT NULL;
CREATE INDEX ix_person_church_ref ON person (lower(church_ref));
