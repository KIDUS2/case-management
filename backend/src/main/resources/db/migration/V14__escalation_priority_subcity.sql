-- kefle ketema (sub-city) of each church
ALTER TABLE church ADD COLUMN sub_city VARCHAR(80);
CREATE INDEX ix_church_sub_city ON church(sub_city);

-- serve in order; the administrator can mark an issue urgent. Late issues are escalated to the administrator.
ALTER TABLE case_issue ADD COLUMN priority VARCHAR(8) NOT NULL DEFAULT 'NORMAL';
ALTER TABLE case_issue ADD COLUMN urgent_by VARCHAR(80);
ALTER TABLE case_issue ADD COLUMN urgent_at TIMESTAMPTZ;
ALTER TABLE case_issue ADD COLUMN escalation_level INT NOT NULL DEFAULT 0;
ALTER TABLE case_issue ADD COLUMN escalated_at TIMESTAMPTZ;
CREATE INDEX ix_issue_queue ON case_issue(department_id, status, priority, referred_at);
