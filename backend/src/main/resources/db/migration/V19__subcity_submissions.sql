-- A sub-city office account is tied to one sub-city.
ALTER TABLE app_user ADD COLUMN sub_city VARCHAR(80);

-- Cases submitted by a sub-city wait for an officer or the administrator to accept them.
ALTER TABLE church_case ADD COLUMN review_status VARCHAR(12) NOT NULL DEFAULT 'ACCEPTED';
ALTER TABLE church_case ADD COLUMN review_note   VARCHAR(1000);
ALTER TABLE church_case ADD COLUMN reviewed_by   VARCHAR(100);
ALTER TABLE church_case ADD COLUMN reviewed_at   TIMESTAMPTZ;
CREATE INDEX ix_case_review ON church_case (review_status);
