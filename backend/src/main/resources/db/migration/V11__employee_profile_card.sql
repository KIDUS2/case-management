-- Full identity for the employee ID card: three-part name, mother's name, spiritual details, photo, ID dates, documents.
ALTER TABLE person ADD COLUMN first_name      VARCHAR(80);
ALTER TABLE person ADD COLUMN middle_name     VARCHAR(80);
ALTER TABLE person ADD COLUMN last_name       VARCHAR(80);
ALTER TABLE person ADD COLUMN mother_name     VARCHAR(160);
ALTER TABLE person ADD COLUMN christian_name  VARCHAR(120);
ALTER TABLE person ADD COLUMN father_confessor VARCHAR(160);
ALTER TABLE person ADD COLUMN spiritual_rank  VARCHAR(40);
ALTER TABLE person ADD COLUMN ordained_on     DATE;
ALTER TABLE person ADD COLUMN photo_file      VARCHAR(80);
ALTER TABLE person ADD COLUMN id_issued_on    DATE;
ALTER TABLE person ADD COLUMN id_expires_on   DATE;

-- split the names we already have: first, middle (father), last (the rest)
UPDATE person SET
  first_name  = split_part(btrim(full_name), ' ', 1),
  middle_name = NULLIF(split_part(btrim(full_name), ' ', 2), ''),
  last_name   = NULLIF(btrim(substr(btrim(full_name), length(split_part(btrim(full_name), ' ', 1)) + length(split_part(btrim(full_name), ' ', 2)) + 3)), '');

UPDATE person SET id_issued_on = created_at::date, id_expires_on = (created_at::date + interval '5 years')::date
 WHERE employee_id IS NOT NULL;

CREATE INDEX ix_person_mother ON person (lower(mother_name));

CREATE TABLE employee_file (
    id            BIGSERIAL PRIMARY KEY,
    person_id     BIGINT       NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    title         VARCHAR(160) NOT NULL,
    kind          VARCHAR(40),
    original_name VARCHAR(200) NOT NULL,
    stored_name   VARCHAR(80)  NOT NULL,
    content_type  VARCHAR(120),
    size_bytes    BIGINT       NOT NULL,
    uploaded_by   VARCHAR(80)  NOT NULL,
    uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_employee_file_person ON employee_file(person_id);
