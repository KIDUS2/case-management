-- A department (or the desk) sends a comment to a church; the church's findings come back; the admin decides.
CREATE TABLE church_inquiry (
    id              BIGSERIAL PRIMARY KEY,
    case_id         BIGINT       NOT NULL REFERENCES church_case(id) ON DELETE CASCADE,
    issue_id        BIGINT       REFERENCES case_issue(id) ON DELETE SET NULL,
    department_id   BIGINT       REFERENCES department(id) ON DELETE SET NULL,
    church_id       BIGINT       REFERENCES church(id) ON DELETE SET NULL,
    status          VARCHAR(12)  NOT NULL DEFAULT 'OPEN',
    question        TEXT         NOT NULL,
    asked_by        VARCHAR(80)  NOT NULL,
    asked_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    finding         TEXT,
    finding_by      VARCHAR(80),
    finding_at      TIMESTAMPTZ,
    decision        TEXT,
    church_agreed   BOOLEAN,
    decided_by      VARCHAR(80),
    decided_at      TIMESTAMPTZ
);
CREATE INDEX ix_inquiry_case ON church_inquiry(case_id);
CREATE INDEX ix_inquiry_status ON church_inquiry(status);

ALTER TABLE case_file ADD COLUMN inquiry_id BIGINT REFERENCES church_inquiry(id) ON DELETE SET NULL;
ALTER TABLE case_file ADD COLUMN stage VARCHAR(10);
CREATE INDEX ix_file_inquiry ON case_file(inquiry_id);
