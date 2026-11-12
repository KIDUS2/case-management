-- Employee profile details kept on the person record, so a case and the employee directory are the same person.
ALTER TABLE person ADD COLUMN profession VARCHAR(120);
ALTER TABLE person ADD COLUMN position   VARCHAR(120);
ALTER TABLE person ADD COLUMN gender     VARCHAR(10);
ALTER TABLE person ADD COLUMN birth_date DATE;
ALTER TABLE person ADD COLUMN hire_date  DATE;
ALTER TABLE person ADD COLUMN address    VARCHAR(255);
ALTER TABLE person ADD COLUMN email      VARCHAR(120);
ALTER TABLE person ADD COLUMN notes      TEXT;
